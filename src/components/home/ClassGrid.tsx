import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ClassGroup } from '../../types';
import { getClassTileStyle } from '../../data/colorTokens';

interface ClassGridProps {
  classes: ClassGroup[];
  onSelectClass: (classSort: string) => void;
}

export const ClassGrid: React.FC<ClassGridProps> = ({ classes, onSelectClass }) => (
  <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 id="visual-grid-title" className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1E2233]">
          Browse by class
        </h2>
        <p className="text-sm text-[#6B7280]">
          Sample preview lessons free. Sign in with a free account to unlock all chapters, notes & doubts.
        </p>
      </div>
      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#3B4FE0]/10 text-[#3B4FE0] border border-[#3B4FE0]/20">
        Free Previews Available
      </span>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {classes.map((cls, i) => {
        const style = getClassTileStyle(cls.class_sort);
        const number = parseInt(cls.class_sort, 10);
        return (
          <button
            key={cls.class_sort}
            onClick={() => onSelectClass(cls.class_sort)}
            data-reveal
            style={{ backgroundColor: style.bg, borderColor: style.border, color: style.text, '--reveal-delay': `${Math.min(i, 11) * 50}ms` } as React.CSSProperties}
            aria-label={`${cls.class_display}: ${cls.subjects.length} subjects, ${cls.videoCount} lessons`}
            className="bento-hover relative overflow-hidden text-left p-4 sm:p-5 rounded-3xl border cursor-pointer group min-h-[140px] flex flex-col justify-between"
          >
            <span
              aria-hidden="true"
              className="absolute -right-2 -bottom-6 text-[88px] sm:text-[104px] font-semibold leading-none opacity-[0.12] select-none transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1"
            >
              {number}
            </span>
            <div className="relative flex items-start justify-between">
              <span className="text-sm font-semibold">{cls.class_display}</span>
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ backgroundColor: style.badgeBg }}
              >
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <div className="relative space-y-1.5">
              <p className="text-[11px] font-medium opacity-80 line-clamp-1">{cls.subjects.join(' · ') || 'Coming soon'}</p>
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-semibold">
                  {cls.videoCount} {cls.videoCount === 1 ? 'lesson' : 'lessons'}
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 shadow-2xs">
                  Free Preview
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);
