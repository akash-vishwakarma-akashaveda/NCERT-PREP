import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: 'home' | 'browse' | 'profile' | 'privacy') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-auto bg-white border-t border-[#E3E5EC] py-10">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#3B4FE0] flex items-center justify-center">
                <svg className="w-3.5 h-3.5 fill-white ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="text-base font-bold text-[#1E2233]">
                <span className="text-[#3B4FE0]">NCERT</span>
                <span className="text-[#12A594] ml-1">Prep</span>
              </span>
            </div>
            <p className="mt-2 text-xs text-[#6B7280] max-w-sm">
              Adaptive, distraction-free video revision for Class 1 to 12 CBSE & State NCERT curriculum.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-6 text-xs text-[#6B7280]">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-[#3B4FE0] transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className="hover:text-[#3B4FE0] transition-colors cursor-pointer"
            >
              Browse Curriculum
            </button>
            <button
              onClick={() => onNavigate('privacy')}
              className="flex items-center gap-1 hover:text-[#3B4FE0] transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              Privacy Policy (DPDP Act)
            </button>
          </div>
        </div>

        {/* Disclaimer per SRS Naming Note */}
        <div className="mt-8 pt-6 border-t border-[#E3E5EC] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#6B7280] gap-4">
          <p className="text-center sm:text-left">
            Educational revision platform. Curated from public educational resources. NCERT Prep is not officially affiliated with or endorsed by NCERT.
          </p>
          <div className="flex items-center gap-1.5 text-[#12A594] font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Built for distraction-free revision</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
