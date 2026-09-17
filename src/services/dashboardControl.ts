import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface DashboardAnnouncement {
  id: string;
  title: string;
  message: string;
  tone: 'info' | 'warning' | 'success' | 'exam';
  targetClass: string; // 'all' or '01'..'12'
  actionLabel?: string;
  actionUrl?: string;
  isActive: boolean;
  createdAt: number;
}

export interface SpotlightLesson {
  classSort: string; // 'all' or '01'..'12'
  videoId: string;
  title: string;
  subject: string;
  chapterName: string;
  note: string; // Teacher note, e.g. "Focus topic for this week"
  isActive: boolean;
  updatedAt: number;
}

export interface ContentAccessPolicy {
  freePreviewEnabled: boolean;
  freePreviewCount: number;
  allowGuestNotes: boolean;
  allowGuestDoubts: boolean;
}

export interface StudentDashboardConfig {
  announcement: DashboardAnnouncement | null;
  spotlights: Record<string, SpotlightLesson>; // classSort -> SpotlightLesson
  policy: ContentAccessPolicy;
}

const STORAGE_KEY = 'ncert_prep_student_dashboard_config';
const CONFIG_DOC_PATH = 'settings/student_dashboard';

const DEFAULT_CONFIG: StudentDashboardConfig = {
  announcement: {
    id: 'ann-default',
    title: 'NCERT Board Revision Sprint 2026–27',
    message: 'New high-yield chapter one-shots, formula cheat sheets, and PYQ video solutions are live across all grades.',
    tone: 'exam',
    targetClass: 'all',
    actionLabel: 'Browse Syllabus',
    actionUrl: '/app/subjects',
    isActive: true,
    createdAt: Date.now(),
  },
  spotlights: {
    '10': {
      classSort: '10',
      videoId: 'd4b_B295xY8',
      title: 'Chemical Reactions and Equations | Full Chapter One-Shot Revision',
      subject: 'Science',
      chapterName: 'Chemical Reactions and Equations',
      note: 'Educator Spotlight: Master balancing equations and redox reactions before Friday.',
      isActive: true,
      updatedAt: Date.now(),
    },
    '12': {
      classSort: '12',
      videoId: 'phys12_ch1',
      title: 'Electric Charges and Fields | Complete High-Yield Revision',
      subject: 'Physics',
      chapterName: 'Electric Charges and Fields',
      note: 'Educator Spotlight: Core derivations for Gauss Law and Coulomb Law.',
      isActive: true,
      updatedAt: Date.now(),
    },
  },
  policy: {
    freePreviewEnabled: true,
    freePreviewCount: 1,
    allowGuestNotes: false,
    allowGuestDoubts: false,
  },
};

function readLocalConfig(): StudentDashboardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Could not read dashboard config from local storage', err);
  }
  return DEFAULT_CONFIG;
}

function writeLocalConfig(cfg: StudentDashboardConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    window.dispatchEvent(new CustomEvent('ncert_dashboard_config_updated', { detail: cfg }));
  } catch (err) {
    console.warn('Could not save dashboard config to local storage', err);
  }
}

export const DashboardControlService = {
  async getConfig(): Promise<StudentDashboardConfig> {
    const local = readLocalConfig();
    if (!db) return local;
    try {
      const snap = await getDoc(doc(db, CONFIG_DOC_PATH));
      if (snap.exists()) {
        const data = snap.data() as StudentDashboardConfig;
        writeLocalConfig(data);
        return data;
      }
    } catch (err) {
      // Fallback to local config when offline or without permissions
    }
    return local;
  },

  async saveConfig(cfg: StudentDashboardConfig): Promise<void> {
    writeLocalConfig(cfg);
    if (!db) return;
    try {
      await setDoc(doc(db, CONFIG_DOC_PATH), cfg, { merge: true });
    } catch (err) {
      console.warn('Firestore sync skipped for dashboard config', err);
    }
  },

  async setAnnouncement(announcement: DashboardAnnouncement | null): Promise<void> {
    const cfg = await this.getConfig();
    cfg.announcement = announcement;
    await this.saveConfig(cfg);
  },

  async setSpotlight(spotlight: SpotlightLesson): Promise<void> {
    const cfg = await this.getConfig();
    cfg.spotlights[spotlight.classSort] = spotlight;
    await this.saveConfig(cfg);
  },

  async removeSpotlight(classSort: string): Promise<void> {
    const cfg = await this.getConfig();
    delete cfg.spotlights[classSort];
    await this.saveConfig(cfg);
  },

  async updatePolicy(policy: Partial<ContentAccessPolicy>): Promise<void> {
    const cfg = await this.getConfig();
    cfg.policy = { ...cfg.policy, ...policy };
    await this.saveConfig(cfg);
  },
};
