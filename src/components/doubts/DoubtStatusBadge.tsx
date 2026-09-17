import React from 'react';
import { DoubtStatus } from '../../types';

const STYLES: Record<DoubtStatus, { label: string; className: string }> = {
  open: { label: 'Waiting for reply', className: 'bg-amber-100 text-amber-900' },
  answered: { label: 'Answered', className: 'bg-emerald-100 text-emerald-800' },
  closed: { label: 'Closed', className: 'bg-slate-200 text-slate-700' },
};

export const DoubtStatusBadge: React.FC<{ status: DoubtStatus; unread?: boolean; adminView?: boolean }> = ({
  status,
  unread,
  adminView,
}) => {
  const style = STYLES[status];
  const label = adminView && status === 'open' ? 'Open' : style.label;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${style.className}`}>
        {label}
      </span>
      {unread && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#3B4FE0] text-white">New reply</span>
      )}
    </span>
  );
};
