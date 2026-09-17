import React, { useState } from 'react';
import { Bell, BellOff, Check, CalendarDays, CalendarClock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type Frequency = 'daily' | 'weekly';

const OPTIONS: { id: Frequency; title: string; detail: string; icon: React.ReactNode }[] = [
  { id: 'daily', title: 'Daily study prompt', detail: 'Every day', icon: <CalendarClock className="w-4 h-4" /> },
  { id: 'weekly', title: 'Weekly revision digest', detail: 'Every Sunday', icon: <CalendarDays className="w-4 h-4" /> },
];

// Daytime hours only; nobody wants a revision email at 3 AM.
export const REMINDER_HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

export const reminderHour = (frequency: Frequency, hour?: number) => hour ?? (frequency === 'daily' ? 19 : 18);

export const formatHour = (hour: number) => `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;

export const reminderSummary = (enabled: boolean, frequency: Frequency, hour?: number) =>
  enabled ? `${frequency === 'daily' ? 'Daily' : 'Sun'}, ${formatHour(reminderHour(frequency, hour))}` : 'Off';

export const ReminderSettingsCard: React.FC = () => {
  const { user, updateSettings } = useAuth();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'saved' | 'error'; text: string } | null>(null);

  if (!user) return null;
  const enabled = user.reminders_enabled;
  const noEmail = !user.email;

  const save = async (
    changes: { reminders_enabled?: boolean; reminder_frequency?: Frequency; reminder_hour?: number },
    text: string
  ) => {
    setSaving(true);
    setStatus(null);
    try {
      await updateSettings(changes);
      setStatus({ type: 'saved', text });
      setTimeout(() => setStatus((s) => (s?.text === text ? null : s)), 3000);
    } catch {
      setStatus({ type: 'error', text: 'Could not save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="reminders" aria-labelledby="reminders-title" className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-5 scroll-mt-24">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              enabled ? 'bg-[#E1F5EE] text-[#12A594]' : 'bg-[#F5F6FA] text-[#6B7280]'
            }`}
          >
            {enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </span>
          <div>
            <h2 id="reminders-title" className="text-lg font-semibold text-[#1E2233]">
              Revision reminders
            </h2>
            <p className="text-sm text-[#6B7280]">
              {enabled
                ? `On · ${reminderSummary(true, user.reminder_frequency, user.reminder_hour)} IST to ${user.email || 'your email'}`
                : 'Off · turn on to get an email suggesting your next lesson'}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Email revision reminders"
          disabled={saving || noEmail}
          onClick={() => save({ reminders_enabled: !enabled }, enabled ? 'Reminders turned off.' : 'Reminders turned on.')}
          className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            enabled ? 'bg-[#12A594]' : 'bg-[#CBD5E1]'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {noEmail && (
        <p className="p-3 rounded-xl bg-[#F5F6FA] border border-[#E3E5EC] text-xs text-[#6B7280]">
          Reminders are sent by email. You signed in with a mobile number, so there is no email address to send them to.
        </p>
      )}

      <fieldset disabled={!enabled || saving} className="space-y-2">
        <legend className="text-xs font-semibold text-[#1E2233] mb-2">How often?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {OPTIONS.map((opt) => {
            const selected = user.reminder_frequency === opt.id;
            return (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors ${
                  !enabled
                    ? 'border-[#E3E5EC] bg-[#F5F6FA] text-[#6B7280] cursor-not-allowed'
                    : selected
                    ? 'border-[#3B4FE0] bg-[#EEEDFE]/60 text-[#26215C] cursor-pointer'
                    : 'border-[#E3E5EC] bg-white text-[#1E2233] hover:border-[#3B4FE0]/40 cursor-pointer'
                }`}
              >
                <input
                  type="radio"
                  name="reminder_frequency"
                  value={opt.id}
                  checked={selected}
                  onChange={() => save({ reminder_frequency: opt.id }, `Reminders set to ${opt.title.toLowerCase()}.`)}
                  className="accent-[#3B4FE0]"
                />
                <span className={selected && enabled ? 'text-[#3B4FE0]' : ''}>{opt.icon}</span>
                <span className="text-sm">
                  <span className="block font-semibold">{opt.title}</span>
                  <span className="block text-xs text-[#6B7280]">{opt.detail}</span>
                </span>
              </label>
            );
          })}
        </div>
        <label className="flex flex-wrap items-center gap-2 pt-2 text-sm text-[#1E2233]">
          <span className="font-semibold">Send at</span>
          <select
            value={reminderHour(user.reminder_frequency, user.reminder_hour)}
            onChange={(e) => save({ reminder_hour: Number(e.target.value) }, `Reminders will arrive at ${formatHour(Number(e.target.value))} IST.`)}
            className="px-3 py-2 rounded-xl border border-[#E3E5EC] bg-white text-sm focus:border-[#3B4FE0] outline-none disabled:bg-[#F5F6FA] disabled:text-[#6B7280]"
          >
            {REMINDER_HOURS.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
          <span className="text-xs text-[#6B7280]">IST</span>
        </label>
        {!enabled && <p className="text-xs text-[#6B7280]">Turn reminders on to choose how often and when.</p>}
      </fieldset>

      <div className="min-h-5 text-xs" aria-live="polite">
        {status && (
          <span className={`inline-flex items-center gap-1 font-semibold ${status.type === 'saved' ? 'text-emerald-700' : 'text-rose-700'}`}>
            {status.type === 'saved' && <Check className="w-3.5 h-3.5" />}
            {status.text}
          </span>
        )}
        {!status && <span className="text-[#6B7280]">Every email has a one-click unsubscribe link.</span>}
      </div>
    </section>
  );
};
