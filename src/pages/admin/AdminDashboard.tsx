import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  PlaySquare,
  FileText,
  MessageCircleQuestion,
  MessageSquare,
  Database,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { ChapterNotes, Doubt, Feedback, Video } from '../../types';
import { CurriculumRecords, DoubtsService, NotesService, countStudentsByClass } from '../../services/content';
import { FirestoreService } from '../../services/firestore';
import { useAuth } from '../../context/AuthContext';
import { buildAdminTree } from './adminTree';
import { useToast } from './adminUi';
import { OverviewSection } from './OverviewSection';
import { CurriculumSection } from './CurriculumSection';
import { VideosSection } from './VideosSection';
import { NotesSection } from './NotesSection';
import { DoubtsSection } from './DoubtsSection';
import { FeedbackSection } from './FeedbackSection';
import { DataSection } from './DataSection';

export type AdminSectionId = 'overview' | 'curriculum' | 'videos' | 'notes' | 'doubts' | 'feedback' | 'data';

export interface AdminNavigateOptions {
  notesKey?: string;
  doubtId?: string;
}

interface AdminDashboardProps {
  allVideos: Video[];
  records: CurriculumRecords;
  onRefreshCatalog: () => Promise<void>;
  onBackToApp: () => void;
  onSelectVideo: (video: Video) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  allVideos,
  records,
  onRefreshCatalog,
  onBackToApp,
  onSelectVideo,
}) => {
  const { user } = useAuth();
  const adminName = user?.displayName || user?.email || 'Educator';
  const { notify, toastNode } = useToast();

  const [section, setSection] = useState<AdminSectionId>('overview');
  const [navOptions, setNavOptions] = useState<AdminNavigateOptions>({});
  const [notes, setNotes] = useState<ChapterNotes[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [studentStats, setStudentStats] = useState<{ total: number; byClass: Record<string, number> } | null>(null);

  const tree = useMemo(() => buildAdminTree(allVideos, records), [allVideos, records]);

  const reloadNotes = useCallback(async () => {
    try {
      setNotes(await NotesService.listAll());
    } catch (err) {
      notify('Could not load notes. Check your connection and admin role.', 'error');
    }
  }, [notify]);

  const reloadDoubts = useCallback(async () => {
    try {
      setDoubts(await DoubtsService.listAll());
    } catch (err) {
      notify('Could not load doubts. Check your connection and admin role.', 'error');
    }
  }, [notify]);

  const reloadFeedback = useCallback(async () => {
    setFeedbacks(await FirestoreService.getFeedbackList());
  }, []);

  useEffect(() => {
    reloadNotes();
    reloadDoubts();
    reloadFeedback();
    countStudentsByClass().then(setStudentStats);
  }, [reloadNotes, reloadDoubts, reloadFeedback]);

  const navigate = (next: AdminSectionId, options: AdminNavigateOptions = {}) => {
    setNavOptions(options);
    setSection(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDoubts = doubts.filter((d) => d.status === 'open').length;
  const newFeedback = feedbacks.filter((f) => f.status !== 'reviewed').length;

  const navItems: { id: AdminSectionId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'curriculum', label: 'Classes & Chapters', icon: <Layers className="w-4 h-4" /> },
    { id: 'videos', label: 'Videos', icon: <PlaySquare className="w-4 h-4" /> },
    { id: 'notes', label: 'Notes & Cheat Sheets', icon: <FileText className="w-4 h-4" /> },
    { id: 'doubts', label: 'Doubts', icon: <MessageCircleQuestion className="w-4 h-4" />, badge: openDoubts },
    { id: 'feedback', label: 'Feedback', icon: <MessageSquare className="w-4 h-4" />, badge: newFeedback },
    { id: 'data', label: 'Data & Sync', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="pb-32 lg:pb-12">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-60 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-3">
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-300" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold">Admin Dashboard</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || adminName}</p>
                </div>
              </div>
              <button
                onClick={onBackToApp}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to app
              </button>
            </div>

            <nav
              aria-label="Admin sections"
              className="flex lg:flex-col gap-1 overflow-x-auto bg-white border border-[#E3E5EC] rounded-2xl p-1.5"
            >
              {navItems.map((item) => {
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      active ? 'bg-[#3B4FE0] text-white' : 'text-[#1E2233] hover:bg-[#F5F6FA]'
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge ? (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          active ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {section === 'overview' && (
            <OverviewSection
              tree={tree}
              videos={allVideos}
              notes={notes}
              doubts={doubts}
              feedbacks={feedbacks}
              studentStats={studentStats}
              onNavigate={navigate}
            />
          )}
          {section === 'curriculum' && (
            <CurriculumSection
              tree={tree}
              notes={notes}
              onRefreshCatalog={onRefreshCatalog}
              notify={notify}
              onEditNotes={(notesKey) => navigate('notes', { notesKey })}
            />
          )}
          {section === 'videos' && (
            <VideosSection
              videos={allVideos}
              tree={tree}
              onRefreshCatalog={onRefreshCatalog}
              notify={notify}
              onSelectVideo={onSelectVideo}
            />
          )}
          {section === 'notes' && (
            <NotesSection
              tree={tree}
              notes={notes}
              reloadNotes={reloadNotes}
              notify={notify}
              adminName={adminName}
              initialKey={navOptions.notesKey}
            />
          )}
          {section === 'doubts' && (
            <DoubtsSection
              doubts={doubts}
              reloadDoubts={reloadDoubts}
              notify={notify}
              adminName={adminName}
              initialDoubtId={navOptions.doubtId}
              videos={allVideos}
              onSelectVideo={onSelectVideo}
            />
          )}
          {section === 'feedback' && (
            <FeedbackSection feedbacks={feedbacks} reloadFeedback={reloadFeedback} notify={notify} />
          )}
          {section === 'data' && (
            <DataSection tree={tree} videoCount={allVideos.length} onRefreshCatalog={onRefreshCatalog} notify={notify} />
          )}
        </main>
      </div>
      {toastNode}
    </div>
  );
};
