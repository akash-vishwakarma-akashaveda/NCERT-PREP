import React, { useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import { DoubtsProvider } from './context/DoubtsContext';
import { CatalogProvider, useCatalogContext } from './context/CatalogContext';
import { NotesTarget } from './types';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AuthPages } from './components/auth/AuthPages';
import { SearchResultsModal } from './components/search/SearchResultsModal';
import { RevisionNotesModal } from './components/app/RevisionNotesModal';
import { LandingPage } from './pages/LandingPage';
import { BrowsePage } from './pages/BrowsePage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudentLayout } from './student/StudentLayout';
import { HomePage } from './student/pages/HomePage';
import { SubjectDetailPage, SubjectsPage } from './student/pages/SubjectsPage';
import { LessonPage } from './student/pages/LessonPage';
import { DoubtsPage, FocusPage, ProfilePage, RemindersPage, SavedPage } from './student/pages/AccountPages';

type PublicTab = 'home' | 'browse' | 'profile' | 'privacy';
const PUBLIC_PATHS: Partial<Record<PublicTab, string>> = { home: '/', browse: '/browse', privacy: '/privacy' };

// Visitor pages: landing, syllabus explorer, privacy, public lesson view.
const PublicLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const { activeVideos } = useCatalogContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  // Signed-in users live in /app; privacy stays readable for everyone.
  if (!loading && user && pathname !== '/privacy') {
    const lesson = pathname.match(/^\/watch\/(.+)$/);
    return <Navigate to={lesson ? `/app/lesson/${lesson[1]}` : '/app'} replace />;
  }

  const go = (tab: PublicTab) => navigate(PUBLIC_PATHS[tab] || '/');

  return (
    <div className={`min-h-screen flex flex-col text-[#1E2233] ${pathname === '/' ? 'page-glow' : 'bg-[#F5F6FA]'}`}>
      <Navbar
        currentTab={pathname === '/browse' ? 'browse' : 'home'}
        onNavigate={go}
        onOpenSearch={() => setSearchOpen(true)}
        showSearch={pathname !== '/'}
      />
      <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-10 pt-6">
        <Outlet context={{ openSearch: () => setSearchOpen(true) }} />
      </main>
      <Footer onNavigate={go} />
      <SearchResultsModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        videos={activeVideos}
        onSelectVideo={(v) => {
          setSearchOpen(false);
          navigate(`/watch/${encodeURIComponent(v.youtube_id)}`);
        }}
      />
    </div>
  );
};

const LandingRoute: React.FC = () => {
  const { classes, allVideos } = useCatalogContext();
  const { setAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  return (
    <LandingPage
      classes={classes}
      allVideos={allVideos}
      onExploreCurriculum={() => navigate('/browse')}
      onSelectVideo={(v) => navigate(`/watch/${encodeURIComponent(v.youtube_id)}`)}
      onSelectClass={(classSort) => navigate(`/browse?class=${classSort}`)}
      onLaunchDemoAuth={() => setAuthModalOpen(true)}
    />
  );
};

const BrowseRoute: React.FC = () => {
  const { classes, getSubjectsForClass } = useCatalogContext();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [notesTarget, setNotesTarget] = useState<NotesTarget | null>(null);
  return (
    <>
      <BrowsePage
        classes={classes}
        selectedClassSort={params.get('class') || '10'}
        selectedSubjectName={params.get('subject') || undefined}
        getSubjectsForClass={getSubjectsForClass}
        onSelectClass={(c) => setParams({ class: c })}
        onSelectVideo={(v) => navigate(`/watch/${encodeURIComponent(v.youtube_id)}`)}
        onNavigateHome={() => navigate('/')}
        onOpenNotes={setNotesTarget}
      />
      {notesTarget && <RevisionNotesModal isOpen onClose={() => setNotesTarget(null)} target={notesTarget} />}
    </>
  );
};

const AdminRoute: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const { allVideos, records, refreshCatalog } = useCatalogContext();
  const navigate = useNavigate();
  if (loading && !user) return null;
  if (!isAdmin) return <Navigate to={user ? '/app' : '/'} replace />;
  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#1E2233]">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <AdminDashboard
          allVideos={allVideos}
          records={records}
          onRefreshCatalog={refreshCatalog}
          onBackToApp={() => navigate('/app')}
          onSelectVideo={(v) => navigate(`/app/lesson/${encodeURIComponent(v.youtube_id)}`)}
        />
      </div>
    </div>
  );
};

const PrivacyRoute: React.FC = () => {
  const navigate = useNavigate();
  return <PrivacyPage onNavigateHome={() => navigate('/')} />;
};

export const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <ProgressProvider>
        <DoubtsProvider>
          <CatalogProvider>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingRoute />} />
                <Route path="/browse" element={<BrowseRoute />} />
                <Route path="/privacy" element={<PrivacyRoute />} />
                <Route path="/watch/:videoId" element={<LessonPage publicMode />} />
              </Route>

              <Route path="/app" element={<StudentLayout />}>
                <Route index element={<HomePage />} />
                <Route path="subjects" element={<SubjectsPage />} />
                <Route path="subjects/:subject" element={<SubjectDetailPage />} />
                <Route path="lesson/:videoId" element={<LessonPage />} />
                <Route path="doubts" element={<DoubtsPage />} />
                <Route path="saved" element={<SavedPage />} />
                <Route path="focus" element={<FocusPage />} />
                <Route path="reminders" element={<RemindersPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              <Route path="/admin" element={<AdminRoute />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <AuthPages isModal />
          </CatalogProvider>
        </DoubtsProvider>
      </ProgressProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
