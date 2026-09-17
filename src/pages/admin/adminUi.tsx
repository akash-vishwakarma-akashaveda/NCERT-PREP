import React, { useCallback, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const inputClass =
  'w-full px-3 py-2 text-sm border border-[#E3E5EC] rounded-xl bg-white text-[#1E2233] focus:border-[#3B4FE0] focus:ring-1 focus:ring-[#3B4FE0] outline-none disabled:bg-[#F5F6FA] disabled:text-[#6B7280]';

export const primaryButton =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#3B4FE0] hover:bg-[#2F40BD] rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

export const secondaryButton =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1E2233] bg-white border border-[#E3E5EC] hover:bg-[#F5F6FA] rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

export const dangerButton =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50';

export type Notify = (text: string, type?: 'success' | 'error') => void;

export function useToast() {
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error'; id: number } | null>(null);
  const notify: Notify = useCallback((text, type = 'success') => {
    const id = Date.now();
    setToast({ text, type, id });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 4500);
  }, []);

  const node = toast ? (
    <div
      role="status"
      className={`fixed bottom-24 sm:bottom-8 right-4 left-4 sm:left-auto sm:max-w-sm z-[60] p-4 rounded-2xl border shadow-lg text-sm font-semibold flex items-start gap-2.5 ${
        toast.type === 'success'
          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
          : 'bg-rose-50 text-rose-900 border-rose-200'
      }`}
    >
      {toast.type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
      )}
      <span className="flex-1">{toast.text}</span>
      <button onClick={() => setToast(null)} aria-label="Dismiss" className="cursor-pointer text-slate-500">
        <X className="w-4 h-4" />
      </button>
    </div>
  ) : null;

  return { notify, toastNode: node };
}

export const SectionHeader: React.FC<{ title: string; description?: string; actions?: React.ReactNode }> = ({
  title,
  description,
  actions,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
    <div>
      <h2 className="text-xl font-extrabold text-[#1E2233] tracking-tight">{title}</h2>
      {description && <p className="text-xs text-[#6B7280] mt-0.5 max-w-2xl">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white border border-[#E3E5EC] rounded-2xl shadow-2xs ${className}`}>{children}</div>
);

export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'indigo' | 'teal' | 'amber' | 'rose' | 'slate';
  onClick?: () => void;
}> = ({ label, value, hint, tone = 'slate', onClick }) => {
  const toneClass = {
    indigo: 'text-[#3B4FE0]',
    teal: 'text-[#12A594]',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    slate: 'text-[#1E2233]',
  }[tone];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`text-left bg-white p-5 rounded-2xl border border-[#E3E5EC] shadow-2xs space-y-1 ${
        onClick ? 'hover:border-[#3B4FE0]/40 hover:shadow-xs transition-all cursor-pointer' : ''
      }`}
    >
      <p className="text-xs text-[#6B7280] font-semibold">{label}</p>
      <p className={`text-2xl font-extrabold ${toneClass}`}>{value}</p>
      {hint && <p className="text-[11px] text-[#6B7280]">{hint}</p>}
    </Tag>
  );
};

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; body?: string; action?: React.ReactNode }> = ({
  icon,
  title,
  body,
  action,
}) => (
  <div className="py-12 px-6 text-center space-y-2">
    <div className="w-10 h-10 mx-auto text-slate-400 flex items-center justify-center">{icon}</div>
    <p className="text-sm font-semibold text-[#1E2233]">{title}</p>
    {body && <p className="text-xs text-[#6B7280] max-w-md mx-auto">{body}</p>}
    {action && <div className="pt-2">{action}</div>}
  </div>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }> = ({
  checked,
  onChange,
  label,
  disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
      checked ? 'bg-[#12A594]' : 'bg-[#CBD5E1]'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

export const Modal: React.FC<{ title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({
  title,
  subtitle,
  onClose,
  children,
  wide,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2233]/60 backdrop-blur-xs"
    role="dialog"
    aria-modal="true"
    onClick={onClose}
  >
    <div
      className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-xl border border-[#E3E5EC] overflow-hidden`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-6 pt-5 pb-4 border-b border-[#E3E5EC] flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#1E2233]">{title}</h3>
          {subtitle && <p className="text-xs text-[#6B7280]">{subtitle}</p>}
        </div>
        <button onClick={onClose} aria-label="Close" className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto">{children}</div>
    </div>
  </div>
);

export function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}
