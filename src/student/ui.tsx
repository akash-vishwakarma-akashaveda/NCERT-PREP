import React from 'react';
import {
  Atom,
  FlaskConical,
  Sigma,
  Leaf,
  Microscope,
  Languages,
  Globe2,
  BookOpen,
  Calculator,
  Landmark,
  Monitor,
  Brain,
  Users,
  Briefcase,
  Dna,
} from 'lucide-react';
import { getSubjectTileStyle } from '../data/colorTokens';

export const card = 'bg-white border border-[#E5E7EB] rounded-xl';
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#3B4FE0] hover:bg-[#2F40BD] transition-colors cursor-pointer disabled:opacity-50';
export const btnSecondary =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-[#1E2233] bg-white border border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors cursor-pointer disabled:opacity-50';
export const linkText = 'text-sm font-semibold text-[#3B4FE0] hover:underline cursor-pointer';

export const subjectPath = (subject: string) => `/app/subjects/${encodeURIComponent(subject)}`;
export const lessonPath = (youtubeId: string) => `/app/lesson/${encodeURIComponent(youtubeId)}`;

export const formatDuration = (seconds?: number) => (seconds ? `${Math.max(1, Math.round(seconds / 60))} min` : '');

export const PageHeader: React.FC<{ title: string; description?: string; actions?: React.ReactNode }> = ({
  title,
  description,
  actions,
}) => (
  <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[#1E2233]">{title}</h1>
      {description && <p className="mt-1 text-sm text-[#6B7280]">{description}</p>}
    </div>
    {actions}
  </header>
);

export const ProgressBar: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => (
  <div
    className={`h-1.5 w-full bg-[#EEF0F3] rounded-full overflow-hidden ${className}`}
    role="progressbar"
    aria-valuenow={Math.round(value)}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <div className="h-full bg-[#12A594] rounded-full transition-all duration-500" style={{ width: `${value}%` }} />
  </div>
);

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; body?: string; action?: React.ReactNode }> = ({
  icon,
  title,
  body,
  action,
}) => (
  <div className={`${card} px-6 py-12 text-center`}>
    <div className="mx-auto w-11 h-11 rounded-full bg-[#F3F4F6] text-[#6B7280] flex items-center justify-center">{icon}</div>
    <p className="mt-3 text-base font-semibold text-[#1E2233]">{title}</p>
    {body && <p className="mt-1 text-sm text-[#6B7280] max-w-md mx-auto">{body}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const SUBJECT_ICONS: [RegExp, React.ElementType][] = [
  [/physics/i, Atom],
  [/chem/i, FlaskConical],
  [/math/i, Sigma],
  [/bio/i, Dna],
  [/computer/i, Monitor],
  [/psycholog/i, Brain],
  [/sociolog/i, Users],
  [/business/i, Briefcase],
  [/evs|environment/i, Leaf],
  [/english|hindi|sanskrit|language/i, Languages],
  [/geograph/i, Globe2],
  [/history|civics|political|social/i, Landmark],
  [/science/i, Microscope],
  [/account|econom/i, Calculator],
];

export const subjectIcon = (subject: string): React.ElementType =>
  SUBJECT_ICONS.find(([re]) => re.test(subject))?.[1] || BookOpen;

// Course-style cover generated from the subject; never depends on remote thumbnails.
export const SubjectCover: React.FC<{ subject: string; className?: string; size?: 'sm' | 'lg' }> = ({
  subject,
  className = '',
  size = 'lg',
}) => {
  const tint = getSubjectTileStyle(subject);
  const Icon = subjectIcon(subject);
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{ background: `linear-gradient(135deg, ${tint.bg} 0%, ${tint.badgeBg} 100%)`, color: tint.text }}
    >
      <Icon className={size === 'lg' ? 'w-10 h-10 opacity-80' : 'w-6 h-6 opacity-80'} strokeWidth={1.6} />
      <Icon className="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.08]" strokeWidth={1.2} />
    </div>
  );
};
