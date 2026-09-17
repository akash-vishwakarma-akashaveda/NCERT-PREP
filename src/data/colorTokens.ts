export interface ClassTileStyle {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  name: string;
}

export const CLASS_PALETTE: Record<number, ClassTileStyle> = {
  1: {
    bg: '#FAECE7',
    text: '#4A1B0C',
    border: '#F3D2C6',
    badgeBg: '#F5D7CD',
    name: 'coral',
  },
  2: {
    bg: '#E1F5EE',
    text: '#04342C',
    border: '#BCE8DC',
    badgeBg: '#C7EFE4',
    name: 'teal',
  },
  3: {
    bg: '#EEEDFE',
    text: '#26215C',
    border: '#D7D4FC',
    badgeBg: '#E0DEFD',
    name: 'purple',
  },
  4: {
    bg: '#FAEEDA',
    text: '#412402',
    border: '#F3DCB7',
    badgeBg: '#F7E4C4',
    name: 'amber',
  },
  5: {
    bg: '#FBEAF0',
    text: '#4B1528',
    border: '#F5D2DF',
    badgeBg: '#F8D8E5',
    name: 'pink',
  },
  6: {
    bg: '#E6F1FB',
    text: '#042C53',
    border: '#CBE0F7',
    badgeBg: '#D5E6F8',
    name: 'blue',
  },
};

// Subjects reuse the class palette (SRS 2.2) keyed by name, so "Science" keeps one colour on every screen.
export function getSubjectTileStyle(subject: string): ClassTileStyle {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = (hash * 31 + subject.toLowerCase().charCodeAt(i)) >>> 0;
  }
  return CLASS_PALETTE[(hash % 6) + 1];
}

/**
 * Returns accessible styling tokens for a given class index (1-based, wraps around 1-6)
 */
export function getClassTileStyle(classSortOrIndex: string | number): ClassTileStyle {
  const numeric = typeof classSortOrIndex === 'string' ? parseInt(classSortOrIndex.replace(/\D/g, ''), 10) : classSortOrIndex;
  const validIndex = isNaN(numeric) || numeric <= 0 ? 1 : ((numeric - 1) % 6) + 1;
  return CLASS_PALETTE[validIndex] || CLASS_PALETTE[1];
}

export const BRAND_COLORS = {
  primary: '#3B4FE0',
  primaryHover: '#2F40BD',
  secondary: '#12A594',
  secondaryHover: '#0E8577',
  textPrimary: '#1E2233',
  textSecondary: '#6B7280',
  surface: '#FFFFFF',
  bgPage: '#F5F6FA',
  border: '#E3E5EC',
};
