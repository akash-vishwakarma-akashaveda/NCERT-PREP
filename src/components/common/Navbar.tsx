import React from 'react';
import { Search, LogIn, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type NavTab = 'home' | 'browse' | 'privacy' | 'profile';

interface NavbarProps {
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenSearch: () => void;
  // Home has its own hero search, so the bar is hidden there to keep one search per screen.
  showSearch?: boolean;
}

const Logo: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2.5 text-left cursor-pointer shrink-0"
    aria-label="NCERT Prep home"
  >
    <span className="w-9 h-9 rounded-xl bg-[#3B4FE0] flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(59,79,224,0.7)]">
      <svg className="w-4 h-4 fill-white ml-0.5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
    <span className="text-lg font-semibold tracking-tight">
      <span className="text-[#1E2233]">NCERT</span>
      <span className="text-[#12A594]"> Prep</span>
    </span>
  </button>
);

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onOpenSearch,
  showSearch = true,
}) => {
  const { user, isAdmin, setAuthModalOpen } = useAuth();
  const isUserAdmin = isAdmin || user?.role === 'admin' || user?.email === 'admin@ncertprep.edu';

  const goToSection = (id: string) => {
    if (currentTab !== 'home') onNavigate('home');
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), currentTab === 'home' ? 0 : 150);
  };

  const linkClass = (active: boolean) =>
    `px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
      active ? 'text-[#3B4FE0] bg-[#EEEDFE]' : 'text-[#1E2233] hover:bg-[#F5F6FA]'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E3E5EC]/70">
      <div className="w-full px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        <Logo onClick={() => onNavigate('home')} />

        <nav aria-label="Main" className="hidden md:flex items-center gap-1">
          <button onClick={() => goToSection('visual-grid')} className={linkClass(false)}>
            Classes
          </button>
          <button onClick={() => goToSection('features')} className={linkClass(false)}>
            Features
          </button>
          <button onClick={() => goToSection('how-it-works')} className={linkClass(false)}>
            How it works
          </button>
          <button onClick={() => onNavigate('browse')} className={linkClass(currentTab === 'browse')}>
            Syllabus
          </button>
        </nav>

        <div className="flex items-center gap-2">
          {showSearch && (
            <button onClick={onOpenSearch} aria-label="Search lessons" className="p-2 rounded-xl text-[#1E2233] hover:bg-[#F5F6FA] cursor-pointer">
              <Search className="w-5 h-5 text-[#3B4FE0]" />
            </button>
          )}

          {user ? (
            <button
              onClick={() => onNavigate('profile')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#3B4FE0] hover:bg-[#2F40BD] rounded-xl shadow-[0_6px_16px_-8px_rgba(59,79,224,0.8)] transition-colors cursor-pointer"
            >
              {isUserAdmin ? <Shield className="w-4 h-4 text-purple-200" /> : <LayoutDashboard className="w-4 h-4" />}
              <span>{isUserAdmin ? 'Admin Console' : 'Go to App'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-[#1E2233] hover:bg-[#F5F6FA] rounded-xl cursor-pointer"
              >
                Sign in
              </button>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#3B4FE0] hover:bg-[#2F40BD] rounded-xl shadow-[0_6px_16px_-8px_rgba(59,79,224,0.8)] transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 sm:hidden" />
                <span className="sm:hidden">Sign in</span>
                <span className="hidden sm:inline">Get started free</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
