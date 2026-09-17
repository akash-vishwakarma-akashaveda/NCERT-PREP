import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Video, User, UserProgress, Feedback } from '../types';
import { INITIAL_VIDEOS } from '../data/curriculumData';
import { StorageService } from './storage';
import { normalizeVideo, toStoredVideo } from '../data/classFormat';

const SEED_VERSION_KEY = 'chapterplay_seed_version';
const SEED_VERSION = '2';

export const FirestoreService = {
  // Fetch active videos with fallback to initial seed and localStorage caching
  async fetchVideos(): Promise<Video[]> {
    // Check cached catalog first (FR-4)
    const cached = StorageService.getCachedCatalog();

    if (isFirebaseConfigured && db) {
      try {
        const videosRef = collection(db, 'videos');
        const snapshot = await getDocs(videosRef);
        if (!snapshot.empty) {
          const videos: Video[] = [];
          snapshot.forEach((docSnap) => {
            videos.push(normalizeVideo(docSnap.data(), docSnap.id));
          });
          StorageService.setCachedCatalog(videos);
          return videos;
        }
      } catch (err) {
        console.warn('Firestore fetch failed, falling back to cached or seed catalog:', err);
      }
    }

    // Return cached if available, or initialize from rich seed data
    if (cached && cached.length > 0) {
      const normalized = cached.map((v) => normalizeVideo(v as unknown as Record<string, unknown>, v.youtube_id));
      // Demo browsers keep their cached catalogue (with admin edits); add lessons from newer seed data once.
      if (!isFirebaseConfigured && localStorage.getItem(SEED_VERSION_KEY) !== SEED_VERSION) {
        const known = new Set(normalized.map((v) => v.youtube_id));
        const merged = [...normalized, ...INITIAL_VIDEOS.filter((v) => !known.has(v.youtube_id))];
        StorageService.setCachedCatalog(merged);
        localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
        return merged;
      }
      return normalized;
    }

    StorageService.setCachedCatalog(INITIAL_VIDEOS);
    return INITIAL_VIDEOS;
  },

  // Get User Profile from Firestore or LocalStorage
  async getUserProfile(userId: string): Promise<User | null> {
    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', userId);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          return snapshot.data() as User;
        }
      } catch (err) {
        console.warn('Failed to fetch user from Firestore:', err);
      }
    }
    return StorageService.getLocalUser();
  },

  // Create or retrieve user document on first sign-up (Section 4 of SRS)
  async createOrGetUser(
    userId: string,
    email: string | null,
    displayName?: string | null,
    phoneNumber?: string | null
  ): Promise<User> {
    const defaultUser: User = {
      userId,
      email,
      displayName: displayName || email?.split('@')[0] || 'Student',
      phoneNumber: phoneNumber || null,
      reminders_enabled: true,
      reminder_frequency: 'weekly',
      last_watched_video: null,
      created_at: Date.now(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', userId);
        const existing = await getDoc(userRef);
        if (existing.exists()) {
          return existing.data() as User;
        }
        await setDoc(userRef, {
          ...defaultUser,
          created_at: serverTimestamp(),
        });
        StorageService.setLocalUser(defaultUser);
        return defaultUser;
      } catch (err) {
        console.warn('Failed to create/get user in Firestore:', err);
      }
    }

    // Local / Demo mode fallback
    const localUser = StorageService.getLocalUser();
    if (localUser && localUser.userId === userId) {
      return localUser;
    }
    StorageService.setLocalUser(defaultUser);
    return defaultUser;
  },

  // Update user reminder settings (FR-8)
  async updateUserSettings(
    userId: string,
    settings: Partial<Pick<User, 'reminders_enabled' | 'reminder_frequency' | 'reminder_hour'>>
  ): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, settings);
      } catch (err) {
        console.warn('Failed to update user settings in Firestore:', err);
      }
    }

    const localUser = StorageService.getLocalUser();
    if (localUser) {
      StorageService.setLocalUser({ ...localUser, ...settings });
    }
  },

  // Update last watched video (FR-6)
  async updateLastWatched(userId: string, youtubeId: string): Promise<void> {
    StorageService.setLastWatchedVideo(youtubeId);

    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          last_watched_video: youtubeId,
        });
      } catch (err) {
        console.warn('Failed to update last_watched_video in Firestore:', err);
      }
    }

    const localUser = StorageService.getLocalUser();
    if (localUser) {
      StorageService.setLocalUser({ ...localUser, last_watched_video: youtubeId });
    }
  },

  // Fetch all user progress items for a user
  async getUserProgress(userId: string): Promise<Record<string, UserProgress>> {
    const localProgress = StorageService.getUserProgress(userId);

    if (isFirebaseConfigured && db) {
      try {
        const progressCol = collection(db, 'users', userId, 'user_progress');
        const snapshot = await getDocs(progressCol);
        if (!snapshot.empty) {
          const map: Record<string, UserProgress> = {};
          snapshot.forEach((d) => {
            const data = d.data() as Omit<UserProgress, 'youtube_id'>;
            map[d.id] = {
              youtube_id: d.id,
              ...data,
            };
          });
          StorageService.setUserProgress(userId, map);
          return map;
        }
      } catch (err) {
        console.warn('Failed to fetch user progress from Firestore:', err);
      }
    }

    return localProgress;
  },

  // Upsert a video progress record (FR-6)
  async saveVideoProgress(
    userId: string,
    youtubeId: string,
    progress: { completed?: boolean; favorited?: boolean }
  ): Promise<UserProgress> {
    const localMap = StorageService.getUserProgress(userId);
    const existing = localMap[youtubeId] || {
      youtube_id: youtubeId,
      completed: false,
      favorited: false,
      last_viewed: Date.now(),
    };

    const updated: UserProgress = {
      ...existing,
      completed: progress.completed !== undefined ? progress.completed : existing.completed,
      favorited: progress.favorited !== undefined ? progress.favorited : existing.favorited,
      last_viewed: Date.now(),
    };

    localMap[youtubeId] = updated;
    StorageService.setUserProgress(userId, localMap);

    if (isFirebaseConfigured && db) {
      try {
        const progressDoc = doc(db, 'users', userId, 'user_progress', youtubeId);
        await setDoc(progressDoc, {
          completed: updated.completed,
          favorited: updated.favorited,
          last_viewed: serverTimestamp(),
        }, { merge: true });
      } catch (err) {
        console.warn('Failed to save progress to Firestore:', err);
      }
    }

    return updated;
  },

  // Self-service account deletion (NFR-1 / NFR-11)
  async deleteUserAccount(userId: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        // Delete all progress subcollection docs
        const progressCol = collection(db, 'users', userId, 'user_progress');
        const snapshot = await getDocs(progressCol);
        for (const docSnap of snapshot.docs) {
          await deleteDoc(docSnap.ref);
        }
        // Delete user document
        await deleteDoc(doc(db, 'users', userId));
      } catch (err) {
        console.warn('Failed to delete user document from Firestore:', err);
      }
    }
    StorageService.clearUserData(userId);
  },

  // Update full user profile (name, grade preference, study goal, reminders)
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updates);
      } catch (err) {
        console.warn('Failed to update user profile in Firestore:', err);
      }
    }
    const localUser = StorageService.getLocalUser();
    if (localUser) {
      StorageService.setLocalUser({ ...localUser, ...updates });
    }
  },

  // ADMIN: Add a new video to database
  async addVideo(video: Video): Promise<void> {
    const catalog = StorageService.getCachedCatalog() || [...INITIAL_VIDEOS];
    const existingIndex = catalog.findIndex((v) => v.youtube_id === video.youtube_id);
    if (existingIndex >= 0) {
      catalog[existingIndex] = video;
    } else {
      catalog.unshift(video);
    }
    StorageService.setCachedCatalog(catalog);

    if (isFirebaseConfigured && db) {
      try {
        const videoDoc = doc(db, 'videos', video.youtube_id);
        await setDoc(videoDoc, {
          ...toStoredVideo(video),
          created_at: serverTimestamp(),
        });
      } catch (err) {
        console.error('Failed to add video to Firestore:', err);
        throw err;
      }
    }
  },

  // ADMIN: Update existing video metadata
  async updateVideo(youtubeId: string, updates: Partial<Video>): Promise<void> {
    const catalog = StorageService.getCachedCatalog() || [...INITIAL_VIDEOS];
    const index = catalog.findIndex((v) => v.youtube_id === youtubeId);
    if (index >= 0) {
      catalog[index] = { ...catalog[index], ...updates };
      StorageService.setCachedCatalog(catalog);
    }

    if (isFirebaseConfigured && db) {
      try {
        const videoDoc = doc(db, 'videos', youtubeId);
        await updateDoc(videoDoc, toStoredVideo(updates));
      } catch (err) {
        console.error('Failed to update video in Firestore:', err);
        throw err;
      }
    }
  },

  // ADMIN: Toggle video active status (SRS 4.3 Content Moderation)
  async toggleVideoActive(youtubeId: string, isActive: boolean): Promise<void> {
    await this.updateVideo(youtubeId, { isActive });
  },

  // ADMIN: Delete video from database
  async deleteVideo(youtubeId: string): Promise<void> {
    const catalog = StorageService.getCachedCatalog() || [...INITIAL_VIDEOS];
    const filtered = catalog.filter((v) => v.youtube_id !== youtubeId);
    StorageService.setCachedCatalog(filtered);

    if (isFirebaseConfigured && db) {
      try {
        const videoDoc = doc(db, 'videos', youtubeId);
        await deleteDoc(videoDoc);
      } catch (err) {
        console.error('Failed to delete video from Firestore:', err);
        throw err;
      }
    }
  },

  // ADMIN: Seed initial NCERT curriculum into Firestore
  async seedCurriculumToFirestore(): Promise<{ count: number }> {
    let count = 0;
    if (isFirebaseConfigured && db) {
      for (let i = 0; i < INITIAL_VIDEOS.length; i += 450) {
        const batch = writeBatch(db);
        INITIAL_VIDEOS.slice(i, i + 450).forEach((video) => {
          // Re-seeding must not undo an admin's moderation; a missing isActive reads as active.
          const { isActive: _moderation, ...stored } = toStoredVideo(video);
          batch.set(doc(db!, 'videos', video.youtube_id), stored, { merge: true });
          count++;
        });
        await batch.commit();
      }
    }
    // Also ensure local catalog is refreshed
    StorageService.setCachedCatalog(INITIAL_VIDEOS);
    return { count: count > 0 ? count : INITIAL_VIDEOS.length };
  },

  // ADMIN: Fetch feedback submissions for review
  async getFeedbackList(): Promise<Feedback[]> {
    if (isFirebaseConfigured && db) {
      try {
        const feedbackCol = collection(db, 'feedback');
        const snapshot = await getDocs(feedbackCol);
        const list: Feedback[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const createdAt = data.created_at;
          list.push({
            ...(data as Omit<Feedback, 'feedbackId'>),
            feedbackId: docSnap.id,
            created_at:
              createdAt && typeof createdAt.toMillis === 'function' ? createdAt.toMillis() : Date.now(),
          });
        });
        return list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
      } catch (err) {
        console.warn('Failed to fetch feedbacks from Firestore:', err);
      }
    }

    // Return stored local feedbacks or sample feedbacks
    const stored = localStorage.getItem('ncert_prep_feedbacks');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return [
      {
        feedbackId: 'fb-demo-01',
        userId: 'demo-student-user',
        userEmail: 'student@ncertprep.demo',
        youtube_id: 'd4b_B295xY8',
        videoTitle: 'Chemical Reactions and Equations',
        message: 'Could you add more numerical practice for balancing redox equations in the notes?',
        rating: 5,
        status: 'new',
        created_at: Date.now() - 3600000 * 4,
      },
      {
        feedbackId: 'fb-demo-02',
        userId: 'student-99',
        userEmail: 'aarav.sharma@example.com',
        youtube_id: '4x3yVq3c5f8',
        videoTitle: 'Metals and Non-metals',
        message: 'The audio on the electrolytic refining section was super clear. Very helpful for Class 10 boards!',
        rating: 5,
        status: 'reviewed',
        created_at: Date.now() - 3600000 * 24,
      },
    ];
  },

  // ADMIN: Update feedback review status
  async updateFeedbackStatus(feedbackId: string, status: 'new' | 'reviewed'): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const fbDoc = doc(db, 'feedback', feedbackId);
        await updateDoc(fbDoc, { status });
      } catch (err) {
        console.warn('Failed to update feedback status in Firestore:', err);
      }
    }
    const stored = localStorage.getItem('ncert_prep_feedbacks');
    if (stored) {
      try {
        const list: Feedback[] = JSON.parse(stored);
        const idx = list.findIndex((f) => f.feedbackId === feedbackId);
        if (idx >= 0) {
          list[idx].status = status;
          localStorage.setItem('ncert_prep_feedbacks', JSON.stringify(list));
        }
      } catch {
        // ignore
      }
    }
  },
};
