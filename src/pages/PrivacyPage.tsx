import React from 'react';
import { Shield, Lock, Eye, Trash2, Mail, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '../components/navigation/Breadcrumbs';

interface PrivacyPageProps {
  onNavigateHome: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigateHome }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <Breadcrumbs
        items={[
          { label: 'Home', onClick: onNavigateHome },
          { label: 'Privacy Policy', active: true },
        ]}
      />

      {/* Header */}
      <div className="bg-white border border-[#E3E5EC] rounded-2xl p-6 sm:p-8 shadow-2xs space-y-3">
        <div className="w-12 h-12 rounded-xl bg-[#3B4FE0]/10 text-[#3B4FE0] flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E2233]">
          Privacy Policy & Data Protection
        </h1>
        <p className="text-xs text-[#6B7280]">
          Last updated: 17 September 2026 • Compliant with India Digital Personal Data Protection (DPDP) Act, 2023 & NFR-11
        </p>
      </div>

      {/* DPDP Core Disclosures */}
      <div className="bg-white border border-[#E3E5EC] rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6 text-sm text-[#1E2233] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[#1E2233] flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#3B4FE0]" />
            1. What Information We Collect & Why
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            NCERT Prep collects only the minimal data strictly necessary to provide structured revision:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#6B7280]">
            <li>
              <strong>Account Identifier:</strong> Your Google email address or mobile phone number (via Firebase Auth) to maintain your personalized session.
            </li>
            <li>
              <strong>Watch Progress & Favourites:</strong> Records of which educational chapters you completed or marked as favourites, stored under your user profile.
            </li>
            <li>
              <strong>Reminder Preferences:</strong> Whether you opted in to revision reminders and your chosen frequency (daily or weekly).
            </li>
            <li>
              <strong>Private Feedback:</strong> Voluntary notes submitted to the educator regarding specific lessons.
            </li>
          </ul>
        </section>

        <section className="space-y-2 pt-4 border-t border-[#E3E5EC]">
          <h2 className="text-lg font-semibold text-[#1E2233] flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#12A594]" />
            2. Video Playback & No YouTube Tracking
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Videos are embedded using YouTube&apos;s privacy-enhanced domain (<code>youtube-nocookie.com</code>) with controls configured to prevent related-video clutter. We never access your personal YouTube account, browsing history, or private credentials.
          </p>
        </section>

        <section className="space-y-2 pt-4 border-t border-[#E3E5EC]">
          <h2 className="text-lg font-semibold text-[#1E2233] flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#3B4FE0]" />
            3. Revision Reminders & Anti-Spam
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Revision emails are strictly opt-in. Every reminder email contains an explicit <strong>one-click unsubscribe link</strong> that immediately turns off reminder delivery without requiring manual password entry.
          </p>
        </section>

        <section className="space-y-2 pt-4 border-t border-[#E3E5EC]">
          <h2 className="text-lg font-semibold text-[#1E2233] flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            4. Self-Service Account & Data Deletion
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Under the DPDP Act (2023), you have the absolute right to erasure. NCERT Prep provides a self-service account deletion mechanism directly in your <strong>Profile & Settings</strong> screen. Clicking &quot;Delete Account&quot; permanently and instantaneously purges:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <div className="p-3 bg-[#F5F6FA] rounded-xl border border-[#E3E5EC] flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#12A594]" />
              <span>Firebase Auth credentials</span>
            </div>
            <div className="p-3 bg-[#F5F6FA] rounded-xl border border-[#E3E5EC] flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#12A594]" />
              <span>User profile in Firestore</span>
            </div>
            <div className="p-3 bg-[#F5F6FA] rounded-xl border border-[#E3E5EC] flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#12A594]" />
              <span>All user_progress watch records</span>
            </div>
            <div className="p-3 bg-[#F5F6FA] rounded-xl border border-[#E3E5EC] flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#12A594]" />
              <span>Email reminder subscriptions</span>
            </div>
          </div>
        </section>

        <section className="space-y-2 pt-4 border-t border-[#E3E5EC]">
          <h2 className="text-base font-semibold text-[#1E2233]">
            5. Grievance Officer & Contact Channel
          </h2>
          <p className="text-xs text-[#6B7280]">
            For privacy inquiries, data modification requests, or questions regarding this notice:
            <br />
            <strong>Privacy & Grievance Contact:</strong> <code>privacy@ncertprep.io</code>
          </p>
        </section>
      </div>
    </div>
  );
};
