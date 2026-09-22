/**
 * Google Apps Script — Google Sheet → Firestore `videos` batch upsert (SRS 4.1 / 4.2)
 *
 * Setup (Extensions → Apps Script → Project Settings → Script Properties):
 *   FIREBASE_PROJECT_ID  your Firebase project id
 *   SA_CLIENT_EMAIL      service account email with the "Cloud Datastore User" role
 *   SA_PRIVATE_KEY       the service account private key (the "private_key" value from its JSON key)
 *   SHEET_NAME           optional: tab to read (default: the first tab, never "whichever tab is open")
 * Credentials live in Script Properties, never in this source file.
 *
 * The sheet is the source of truth for lesson content. Header names are matched case-insensitively,
 * column order does not matter, and every other column in the sheet is ignored.
 *   Required: class | Class Numeral | subject | book | chapter | Chapter Title | YT Vid Title | YT Vid ID
 *   Optional: YT Vid Published   -> yt_public  (true only for "PUBLISH_OK…"; students never see the rest)
 *             url                -> pdf_url    (NCERT chapter PDF)
 *             Timestamps         -> timestamps ("mm:ss - topic" lines, shown as "What you'll learn")
 *             English Chapter Name is used as chapter_name when Chapter Title is empty.
 *
 * Guarantees:
 *   - Keyed on YT Vid ID: existing documents are updated in place, new rows create documents.
 *   - Sheet-owned fields are overwritten on every sync; edit them in the sheet, not the admin panel.
 *   - `isActive` is NEVER written for existing documents (admin moderation survives every re-sync).
 *     New documents are created with isActive = true and isPremium = false (SRS defaults).
 *   - "Chapter1" is stored as "Chapter 1" so spacing differences never split a chapter.
 *   - video_title keeps only the part before the first " | " (the SEO suffix is dropped).
 *   - Writes go through Firestore `documents:commit` in batches of up to 500.
 */

var COLUMN_MAP = {
  'class': 'class_display',
  'class numeral': 'class_sort',
  'subject': 'subject',
  'book': 'textbook',
  'chapter': 'chapter_id',
  'chapter title': 'chapter_name',
  'yt vid title': 'video_title',
  'yt vid id': 'youtube_id',
};
var OPTIONAL_COLUMN_MAP = {
  'yt vid published': 'published_raw',
  'url': 'pdf_url',
  'timestamps': 'timestamps',
  'english chapter name': 'english_chapter_name',
};

var SHEET_FIELDS = ['class_display', 'class_sort', 'subject', 'textbook', 'chapter_id', 'chapter_name', 'video_title'];
var OPTIONAL_STRING_FIELDS = ['pdf_url', 'timestamps'];
var COMMIT_BATCH_SIZE = 500;
var LOOKUP_BATCH_SIZE = 300;

function onOpen() {
  SpreadsheetApp.getUi().createMenu('NCERT Prep').addItem('Sync videos to Firestore', 'syncSheetToFirestore').addToUi();
}

function syncSheetToFirestore() {
  var config = getConfig_();
  var rows = readRows_();
  if (rows.length === 0) {
    Logger.log('No valid video rows found.');
    return;
  }

  var token = getAccessToken_(config);
  var basePath = 'projects/' + config.projectId + '/databases/(default)/documents';
  var existing = findExistingIds_(rows.map(function (r) { return r.youtube_id; }), basePath, token);

  var writes = rows.map(function (row) {
    var fields = {};
    SHEET_FIELDS.forEach(function (key) {
      fields[key] = { stringValue: row[key] };
    });
    var mask = SHEET_FIELDS.slice();
    OPTIONAL_STRING_FIELDS.forEach(function (key) {
      if (row[key] === undefined) return; // column not in this sheet: leave the stored value alone
      fields[key] = { stringValue: row[key] };
      mask.push(key);
    });
    if (row.published_raw !== undefined) {
      fields.yt_public = { booleanValue: /^PUBLISH_OK/i.test(row.published_raw) };
      mask.push('yt_public');
    }

    if (!existing[row.youtube_id]) {
      fields.isActive = { booleanValue: true };
      fields.isPremium = { booleanValue: false };
      mask.push('isActive', 'isPremium');
    }

    return {
      update: { name: basePath + '/videos/' + row.youtube_id, fields: fields },
      updateMask: { fieldPaths: mask },
    };
  });

  var created = 0;
  rows.forEach(function (r) { if (!existing[r.youtube_id]) created++; });

  for (var i = 0; i < writes.length; i += COMMIT_BATCH_SIZE) {
    var chunk = writes.slice(i, i + COMMIT_BATCH_SIZE);
    firestoreFetch_('https://firestore.googleapis.com/v1/' + basePath + ':commit', token, { writes: chunk });
  }

  Logger.log('Sync complete: ' + rows.length + ' rows upserted (' + created + ' new, ' + (rows.length - created) + ' updated).');
}

function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  var projectId = props.getProperty('FIREBASE_PROJECT_ID');
  var clientEmail = props.getProperty('SA_CLIENT_EMAIL');
  var privateKey = props.getProperty('SA_PRIVATE_KEY');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Set FIREBASE_PROJECT_ID, SA_CLIENT_EMAIL and SA_PRIVATE_KEY in Script Properties.');
  }
  return { projectId: projectId, clientEmail: clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') };
}

function readRows_() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var name = PropertiesService.getScriptProperties().getProperty('SHEET_NAME');
  var sheet = name ? book.getSheetByName(name) : book.getSheets()[0];
  if (!sheet) throw new Error('Sheet "' + name + '" not found. Fix SHEET_NAME in Script Properties.');
  var values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  var headerIndex = {};
  values[0].forEach(function (header, idx) {
    var name = String(header).trim().replace(/\s+/g, ' ').toLowerCase();
    var key = COLUMN_MAP[name] || OPTIONAL_COLUMN_MAP[name];
    if (key && headerIndex[key] === undefined) headerIndex[key] = idx;
  });

  var missing = Object.keys(COLUMN_MAP)
    .filter(function (name) { return headerIndex[COLUMN_MAP[name]] === undefined; });
  if (missing.length > 0) {
    throw new Error('Missing sheet columns: ' + missing.join(', '));
  }

  var byId = {};
  var order = [];
  for (var r = 1; r < values.length; r++) {
    var row = {};
    Object.keys(headerIndex).forEach(function (key) {
      row[key] = String(values[r][headerIndex[key]] || '').trim();
    });

    if (!row.youtube_id) continue;
    row.chapter_id = row.chapter_id.replace(/^chapter\s*/i, 'Chapter ');
    row.video_title = row.video_title.split(' | ')[0].trim() || row.video_title;
    if (!row.chapter_name && row.english_chapter_name) row.chapter_name = row.english_chapter_name;
    delete row.english_chapter_name;
    if (!/^[A-Za-z0-9_-]{11}$/.test(row.youtube_id)) {
      Logger.log('Row ' + (r + 1) + ': skipped, invalid YT Vid ID "' + row.youtube_id + '"');
      continue;
    }
    if (!byId[row.youtube_id]) order.push(row.youtube_id);
    byId[row.youtube_id] = row; // last duplicate row wins
  }
  return order.map(function (id) { return byId[id]; });
}

function findExistingIds_(ids, basePath, token) {
  var existing = {};
  for (var i = 0; i < ids.length; i += LOOKUP_BATCH_SIZE) {
    var documents = ids.slice(i, i + LOOKUP_BATCH_SIZE).map(function (id) {
      return basePath + '/videos/' + id;
    });
    var results = firestoreFetch_('https://firestore.googleapis.com/v1/' + basePath + ':batchGet', token, {
      documents: documents,
      mask: { fieldPaths: ['isActive'] },
    });
    results.forEach(function (res) {
      if (res.found) {
        var name = res.found.name;
        existing[name.substring(name.lastIndexOf('/') + 1)] = true;
      }
    });
  }
  return existing;
}

function firestoreFetch_(url, token, body) {
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('Firestore request failed (' + response.getResponseCode() + '): ' + response.getContentText());
  }
  return JSON.parse(response.getContentText());
}

function getAccessToken_(config) {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('firestore_token');
  if (cached) return cached;

  var now = Math.floor(Date.now() / 1000);
  var header = { alg: 'RS256', typ: 'JWT' };
  var claims = {
    iss: config.clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  var unsigned = base64Url_(JSON.stringify(header)) + '.' + base64Url_(JSON.stringify(claims));
  var signature = Utilities.computeRsaSha256Signature(unsigned, config.privateKey);
  var jwt = unsigned + '.' + base64Url_(signature);

  var response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('Service account token request failed: ' + response.getContentText());
  }
  var token = JSON.parse(response.getContentText()).access_token;
  cache.put('firestore_token', token, 3000);
  return token;
}

function base64Url_(input) {
  return Utilities.base64EncodeWebSafe(input).replace(/=+$/, '');
}
