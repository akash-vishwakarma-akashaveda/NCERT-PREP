import React, { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import {
  Home,
  BookOpen,
  MessageCircleQuestion,
  Bookmark,
  Timer,
  Bell,
  UserRound,
  Shield,
  LogOut,
  Menu,
  X,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Sliders,
  Layers,
  PlaySquare,
  FileText,
  MessageSquare,
  Database,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDoubts } from '../context/DoubtsContext';
import { useCatalogContext } from '../context/CatalogContext';
import { DoubtsService } from '../services/content';
import { FirestoreService } from '../services/firestore';
import { SearchResultsModal } from '../components/search/SearchResultsModal';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { classLabel } from '../data/gamification';
import { FocusTimer, useFocusTimer } from './useFocusTimer';
import { lessonPath } from './ui';

export interface StudentOutletContext {
  timer: FocusTimer;
  openSearch: () => void;
}

export const useStudentContext = () => useOutletContext<StudentOutletContext>();

const COLLAPSE_KEY = 'ncert_prep_sidebar_collapsed';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
  badge?: number;
  hint?: string;
}

export const StudentLayout: React.FC = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const { unreadCount } = useDoubts();
  const { activeVideos, classes } = useCatalogContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const timer = useFocusTimer();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [adminOpenDoubts, setAdminOpenDoubts] = useState(0);
  const [adminFeedbackCount, setAdminFeedbackCount] = useState(0);

  const isUserAdmin = isAdmin || user?.role === 'admin' || user?.email === 'admin@ncertprep.edu';

  useEffect(() => setDrawerOpen(false), [location.pathname, location.search]);

  useEffect(() => {
    if (!isUserAdmin) return;
    let active = true;
    const loadCounts = async () => {
      try {
        const doubts = await DoubtsService.listAll();
        if (active) {
          setAdminOpenDoubts(doubts.filter((d) => d.status === 'open').length);
        }
      } catch {
        // ignore
      }
      try {
        const feedback = await FirestoreService.getFeedbackList();
        if (active) {
          setAdminFeedbackCount(feedback.filter((f) => f.status !== 'reviewed').length);
        }
      } catch {
        // ignore
      }
    };
    loadCounts();
    const onLocal = () => loadCounts();
    window.addEventListener('quickprep-local-change', onLocal);
    window.addEventListener('storage', onLocal);
    return () => {
      active = false;
      window.removeEventListener('quickprep-local-change', onLocal);
      window.removeEventListener('storage', onLocal);
    };
  }, [isUserAdmin]);

  useEffect(() => {
    if (!user || isUserAdmin) return;
    const done = localStorage.getItem(`ncert_prep_onboarded_${user.userId}`) === 'true' || user.onboarding_completed;
    if (!done || !user.grade_preference) setOnboardingOpen(true);
  }, [user?.userId, user?.grade_preference, user?.onboarding_completed, isUserAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (loading && !user) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-[#6B7280]">Loading…</div>;
  }
  if (!user) return <Navigate to="/" replace />;

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, String(!c));
      } catch {
        // Preference just won't persist.
      }
      return !c;
    });

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const classVideos = user.grade_preference && !isUserAdmin
    ? activeVideos.filter((v) => v.class_sort === user.grade_preference)
    : activeVideos;

  const adminNav: NavItem[] = [
    { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/app?tab=student-control', label: 'Dashboard Control', icon: Sliders },
    { to: '/app?tab=curriculum', label: 'Classes & Chapters', icon: Layers },
    { to: '/app?tab=videos', label: 'Video Catalog', icon: PlaySquare },
    { to: '/app?tab=notes', label: 'Notes & Cheat Sheets', icon: FileText },
    { to: '/app?tab=doubts', label: 'Student Doubts', icon: MessageCircleQuestion, badge: adminOpenDoubts },
    { to: '/app?tab=feedback', label: 'Student Feedback', icon: MessageSquare, badge: adminFeedbackCount },
    { to: '/app?tab=data', label: 'Data & Sync', icon: Database },
  ];

  const adminAccountNav: NavItem[] = [
    { to: '/browse', label: 'Student Syllabus View', icon: Eye },
    { to: '/app/profile', label: 'Profile & settings', icon: UserRound },
  ];

  const studentNav: NavItem[] = [
    { to: '/app', label: 'Home', icon: Home, end: true },
    { to: '/app/subjects', label: 'My subjects', icon: BookOpen },
    { to: '/app/doubts', label: 'Doubts', icon: MessageCircleQuestion, badge: unreadCount },
    { to: '/app/saved', label: 'Saved', icon: Bookmark },
    { to: '/app/focus', label: 'Focus timer', icon: Timer, hint: timer.running ? timer.label : undefined },
    { to: '/app/reminders', label: 'Reminders', icon: Bell },
  ];

  const studentAccountNav: NavItem[] = [
    { to: '/app/profile', label: 'Profile & settings', icon: UserRound },
  ];

  const nav: NavItem[] = isUserAdmin ? adminNav : studentNav;
  const accountNav: NavItem[] = isUserAdmin ? adminAccountNav : studentAccountNav;

  const isItemActive = (item: NavItem) => {
    if (isUserAdmin) {
      const currentTab = searchParams.get('tab') || 'overview';
      if (item.to.startsWith('/app?tab=')) {
        const itemTab = new URLSearchParams(item.to.split('?')[1]).get('tab');
        return location.pathname === '/app' && currentTab === itemTab;
      }
      if (item.to === '/app') {
        return location.pathname === '/app' && (!searchParams.get('tab') || currentTab === 'overview');
      }
      if (item.end) {
        return location.pathname === item.to;
      }
      return location.pathname === item.to || location.pathname.startsWith(item.to + '/');
    }

    if (item.end) {
      return location.pathname === item.to;
    }
    return location.pathname === item.to || location.pathname.startsWith(item.to + '/');
  };

  const sidebar = (compact: boolean) => (
    <div className="h-full flex flex-col bg-white">
      <div className={`h-14 flex items-center border-b border-[#E5E7EB] ${compact ? 'justify-center' : 'justify-between px-4'}`}>
        <NavLink to="/app" className="flex items-center gap-2" aria-label="NCERT Prep home">
          <span className="w-8 h-8 rounded-lg bg-[#3B4FE0] flex items-center justify-center shadow-xs">
            <svg className="w-3.5 h-3.5 fill-white ml-0.5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          {!compact && (
            <span className="text-base font-semibold tracking-tight">
              <span className="text-[#1E2233]">NCERT</span>
              <span className="text-[#12A594]"> Prep</span>
            </span>
          )}
        </NavLink>
        {!compact && drawerOpen && (
          <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="md:hidden p-1.5 rounded-lg hover:bg-[#F3F4F6] cursor-pointer">
            <X className="w-5 h-5 text-[#6B7280]" />
          </button>
        )}
      </div>

      {!compact && (
        <div className="px-4 pt-4">
          {isUserAdmin ? (
            <div className="rounded-xl bg-slate-900 text-white p-3 shadow-xs border border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-purple-300 shrink-0">
                  <Shield className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white leading-tight">Educator Console</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email || 'Administrator'}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-[#6B7280]">Enrolled in</p>
              <p className="text-sm font-semibold text-[#1E2233]">{classLabel(user.grade_preference)}</p>
            </>
          )}
        </div>
      )}

      <nav aria-label={isUserAdmin ? "Educator" : "Student"} className={`flex-1 overflow-y-auto py-3 ${compact ? 'px-2' : 'px-3'} space-y-0.5`}>
        {[...nav, null, ...accountNav].map((item, i) => {
          if (item === null) {
            return <div key={`sep-${i}`} className="my-3 border-t border-[#E5E7EB]" />;
          }
          const active = isItemActive(item);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={compact ? item.label : undefined}
              className={`relative flex items-center gap-3 rounded-lg text-sm transition-colors ${compact ? 'justify-center p-2.5' : 'px-3 py-2'} ${
                active ? 'bg-[#EEF0FD] text-[#3B4FE0] font-semibold' : 'text-[#374151] hover:bg-[#F3F4F6]'
              }`}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {!compact && <span className="flex-1 truncate">{item.label}</span>}
              {!compact && item.hint && (
                <span className="text-xs font-mono text-[#12A594]">{item.hint}</span>
              )}
              {item.badge ? (
                compact ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600" />
                ) : (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-600 text-white text-[11px] font-semibold flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <div className={`border-t border-[#E5E7EB] ${compact ? 'p-2' : 'p-3'} space-y-0.5`}>
        <button
          onClick={handleLogout}
          title={compact ? 'Log out' : undefined}
          className={`w-full flex items-center gap-3 rounded-lg text-sm text-[#374151] hover:bg-[#F3F4F6] cursor-pointer ${compact ? 'justify-center p-2.5' : 'px-3 py-2'}`}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!compact && 'Log out'}
        </button>
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`hidden md:flex w-full items-center gap-3 rounded-lg text-sm text-[#6B7280] hover:bg-[#F3F4F6] cursor-pointer ${compact ? 'justify-center p-2.5' : 'px-3 py-2'}`}
        >
          {collapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
          {!compact && 'Collapse'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F7F8FA] text-[#1E2233]">
      <aside className={`hidden md:block sticky top-0 h-screen shrink-0 border-r border-[#E5E7EB] ${collapsed ? 'w-[68px]' : 'w-60'}`}>
        {sidebar(collapsed)}
      </aside>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/40 cursor-default" aria-label="Close menu" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">{sidebar(false)}</div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#E5E7EB] flex items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-[#F3F4F6] cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            className="flex-1 min-w-0 max-w-xl flex items-center gap-2 px-3 h-9 rounded-lg bg-[#F3F4F6] hover:bg-[#ECEEF1] text-sm text-[#6B7280] cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left truncate">
              {isUserAdmin ? 'Search lessons, chapters & catalog' : 'Search lessons and chapters'}
            </span>
            <kbd className="hidden sm:inline text-[11px] px-1.5 py-0.5 rounded border border-[#E5E7EB] bg-white font-mono">/</kbd>
          </button>

          <div className="ml-auto flex items-center gap-1">
            {timer.running && !isUserAdmin && (
              <NavLink
                to="/app/focus"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 h-9 rounded-lg text-sm font-mono font-semibold text-[#0E8577] bg-[#E1F5EE]"
                title="Focus session running"
              >
                <Timer className="w-4 h-4" /> {timer.label}
              </NavLink>
            )}
            <NavLink
              to={isUserAdmin ? '/app?tab=doubts' : '/app/doubts'}
              className="relative p-2 rounded-lg hover:bg-[#F3F4F6]"
              aria-label={isUserAdmin ? `Student doubts (${adminOpenDoubts} open)` : `Doubts${unreadCount ? `, ${unreadCount} new replies` : ''}`}
            >
              <Bell className="w-5 h-5 text-[#4B5563]" />
              {(isUserAdmin ? adminOpenDoubts : unreadCount) > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600" />
              )}
            </NavLink>
            <NavLink to="/app/profile" className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-lg hover:bg-[#F3F4F6]" aria-label="Profile">
              <span
                className={`w-7 h-7 rounded-full text-white text-xs font-semibold flex items-center justify-center ${
                  isUserAdmin ? 'bg-slate-900 ring-2 ring-purple-500/30' : 'bg-[#3B4FE0]'
                }`}
              >
                {isUserAdmin ? <Shield className="w-3.5 h-3.5 text-purple-300" /> : (user.displayName || 'S').charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                {isUserAdmin ? 'Admin' : user.displayName?.split(' ')[0]}
              </span>
            </NavLink>
          </div>
        </header>

        <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-20 md:pb-8">
          <Outlet context={{ timer, openSearch: () => setSearchOpen(true) } satisfies StudentOutletContext} />
        </main>

        {/* Native Mobile Bottom Navigation Bar (md:hidden) */}
        <nav
          aria-label={isUserAdmin ? 'Educator Navigation' : 'Student Navigation'}
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E5E7EB] py-1 px-1.5 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        >
          {isUserAdmin ? (
            <>
              <NavLink
                to="/app"
                className={() =>
                  `flex flex-col items-center justify-center min-w-[50px] py-1 cursor-pointer transition-colors relative ${
                    isItemActive({ to: '/app' } as NavItem) ? 'text-[#3B4FE0]' : 'text-[#6B7280] hover:text-[#1E2233]'
                  }`
                }
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px] font-semibold mt-0.5">Overview</span>
              </NavLink>

              <NavLink
                to="/app?tab=student-control"
                className={() =>
                  `flex flex-col items-center justify-center min-w-[50px] py-1 cursor-pointer transition-colors relative ${
                    isItemActive({ to: '/app?tab=student-control' } as NavItem) ? 'text-[#3B4FE0]' : 'text-[#6B7280] hover:text-[#1E2233]'
                  }`
                }
              >
                <Sliders className="w-5 h-5" />
                <span className="text-[10px] font-semibold mt-0.5">Control</span>
              </NavLink>

              <NavLink
                to="/app?tab=curriculum"
                className={() =>
                  `flex flex-col items-center justify-center min-w-[50px] py-1 cursor-pointer transition-colors relative ${
                    isItemActive({ to: '/app?tab=curriculum' } as NavItem) ? 'text-[#3B4FE0]' : 'text-[#6B7280] hover:text-[#1E2233]'
                  }`
                }
              >
                <Layers className="w-5 h-5" />
                <span className="text-[10px] font-semibold mt-0.5">Classes</span>
              </NavLink>

              <NavLink
                to="/app?tab=doubts"
                className={() =>
                  `flex flex-col items-center justify-center min-w-[50px] py-1 cursor-pointer transition-colors relative ${
                    isItemActive({ to: '/app?tab=doubts' } as NavItem) ? 'text-[#3B4FE0]' : 'text-[#6B7280] hover:text-[#1E2233]'
                  }`
                }
              >
                <div className="relative">
                  <MessageCircleQuestion className="w-5 h-5" />
                  {adminOpenDoubts > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {adminOpenDoubts > 9 ? '9+' : adminOpenDoubts}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold mt-0.5">Doubts</span>
              </NavLink>

              <NavLink
                to="/app/profile"
                className={() =>
                  `flex flex-col items-center justify-center min-w-[50px] py-1 cursor-pointer transition-colors relative ${
                    isItemActive({ to: '/app/profile' } as NavItem) ? 'text-[#3B4FE0]' : 'text-[#6B7280] hover:text-[#1E2233]'
                  }`
                }
              >
                <UserRound className="w-5 h-5" />
                <span className="text-[10px] font-semibold mt-0.5">Profile</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/app"
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center min-w-[50px] py-1 cursor-pointer transition-colors relative ${
                    isActive ? 'text-[#3B4FE0]' : 'text-[#6B7280] hover:text-[#1E2233]'
                  }`
                }
              >
                <Home className="w-5 h-5" />
                <span className="text-[10px] font-semibold mt-0.5">Home</span>
              </NavLink>

              <NavLink
                to="/app/subjects"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center min-w-[50px] py-1 cursor-pointer transition-colors relative ${
                    isActive ? 'text-[#3B4FE0]' : 'text-[#6B7280] hover:text-[#1E2233]'
                  }`
                }
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-[10px] font-semibold mt-0.5">Subjects</span>
              </NavLink>

              <NavLink
                to="/app/focus"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center min-w-[50px] py-1 cursor-pointer transition-colors relative ${
                    isActive ? 'text-[#0E8577]' : 'text-[#6B7280] hover:text-[#1E2233]'
                  }`
                }
              >
                <div className="relative">
                  <Timer className="w-5 h-5" />
                  {timer.running && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>
                <span className="text-[10px] font-semibold mt-0.5">Focus</span>
              </NavLink>

              <NavLink
                to="/app/doubts"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center min-w-[50px] py-1 cursor-pointer transition-colors relative ${
                    isActive ? 'text-[#3B4FE0]' : 'text-[#6B7280] hover:text-[#1E2233]'
                  }`
                }
              >
                <div className="relative">
                  <MessageCircleQuestion className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold mt-0.5">Doubts</span>
              </NavLink>

              <NavLink
                to="/app/profile"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center min-w-[50px] py-1 cursor-pointer transition-colors relative ${
                    isActive ? 'text-[#3B4FE0]' : 'text-[#6B7280] hover:text-[#1E2233]'
                  }`
                }
              >
                <UserRound className="w-5 h-5" />
                <span className="text-[10px] font-semibold mt-0.5">Profile</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      <SearchResultsModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        videos={classVideos}
        onSelectVideo={(v) => {
          setSearchOpen(false);
          navigate(lessonPath(v.youtube_id));
        }}
      />
      <OnboardingWizard
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onCompleted={() => navigate('/app')}
        classes={classes}
      />
    </div>
  );
};
