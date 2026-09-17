import React, { useState, useEffect } from 'react';
import { ClassGroup } from '../../types';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Clock,
  Bell,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getClassCardStyle } from '../../data/stageThemes';
import { StageIcon } from '../common/StageIcon';
import { REMINDER_HOURS, formatHour, reminderHour, reminderSummary } from '../profile/ReminderSettingsCard';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (grade: string) => void;
  classes: ClassGroup[];
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onClose,
  onCompleted,
  classes,
}) => {
  const { user, updateProfile, updateSettings } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState<number>(25);
  const [enableReminders, setEnableReminders] = useState<boolean>(false);
  const [reminderFreq, setReminderFreq] = useState<'daily' | 'weekly'>('weekly');
  const [reminderHourValue, setReminderHourValue] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  // The wizard stays mounted, so re-seed from the latest profile each time it opens.
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSelectedGrade(user?.grade_preference || '');
    setSelectedSubjects(user?.focus_subjects || []);
    setDailyGoal(user?.study_goal_minutes || 25);
    setEnableReminders(Boolean(user?.reminders_enabled));
    setReminderFreq(user?.reminder_frequency || 'weekly');
    setReminderHourValue(user?.reminder_hour);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const hasClass = Boolean(user?.grade_preference);
  const availableSubjects = classes.find((c) => c.class_sort === selectedGrade)?.subjects || [];
  const lessonCount = (grade: string) => classes.find((c) => c.class_sort === grade)?.videoCount || 0;

  const pickGrade = (grade: string) => {
    setSelectedGrade(grade);
    setSelectedSubjects([]);
  };

  // Skipping keeps an already-chosen class; a student without a class must pick one first.
  const handleSkip = async () => {
    if (!hasClass) return;
    if (user) await updateProfile({ onboarding_completed: true });
    localStorage.setItem(`ncert_prep_onboarded_${user?.userId || 'guest'}`, 'true');
    onClose();
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      if (user) {
        await updateProfile({
          grade_preference: selectedGrade,
          study_goal_minutes: dailyGoal,
          focus_subjects: selectedSubjects,
          onboarding_completed: true,
        });

        await updateSettings({
          reminders_enabled: enableReminders,
          reminder_frequency: reminderFreq,
          reminder_hour: reminderHour(reminderFreq, reminderHourValue),
        });
      }

      // Mark in localStorage as well for instant persistent check
      localStorage.setItem(`ncert_prep_onboarded_${user?.userId || 'guest'}`, 'true');
      onCompleted(selectedGrade);
      onClose();
    } catch (err) {
      console.error('Failed to save onboarding preferences:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2233]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E3E5EC] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header & Progress Bar */}
        <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-[#E3E5EC] bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#3B4FE0] text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1E2233]">
                  Personalize Your NCERT Revision
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Step {step} of 4 — Setup your curriculum & study target
                </p>
              </div>
            </div>

            {hasClass && (
              <button
                onClick={handleSkip}
                className="p-1.5 text-[#6B7280] hover:text-[#1E2233] hover:bg-[#F5F6FA] rounded-xl transition-colors cursor-pointer"
                title="Skip setup"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Stepper Progress Indicator */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, label: 'Your Class' },
              { num: 2, label: 'Subjects' },
              { num: 3, label: 'Daily Target' },
              { num: 4, label: 'Ready' },
            ].map((s) => (
              <div key={s.num} className="space-y-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step >= s.num ? 'bg-[#3B4FE0]' : 'bg-[#E3E5EC]'
                  }`}
                />
                <span className="text-[10px] font-semibold text-[#6B7280] block text-center">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Body Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: SELECT CLASS / GRADE */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-extrabold text-[#1E2233]">
                  Which class are you studying in right now?
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Your dashboard, syllabus and search will show only this class. You can change it later in Profile.
                </p>
                {selectedGrade && (
                  <p className="text-[11px] font-semibold text-[#3B4FE0]">
                    Class {parseInt(selectedGrade, 10)}:{' '}
                    {lessonCount(selectedGrade) > 0
                      ? `${lessonCount(selectedGrade)} lessons available`
                      : 'lessons coming soon'}
                  </p>
                )}
              </div>

              {/* Stage Groups */}
              <div className="space-y-4 pt-2">
                {/* Primary */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-700" />
                    <span>Primary Foundation (Classes 1–5)</span>
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {['01', '02', '03', '04', '05'].map((c) => {
                      const style = getClassCardStyle(c);
                      const isSelected = selectedGrade === c;
                      return (
                        <button
                          key={c}
                          onClick={() => pickGrade(c)}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            isSelected
                              ? 'ring-2 shadow-sm scale-105'
                              : 'bg-white hover:bg-[#F5F6FA] border-[#E3E5EC]'
                          }`}
                          style={{
                            borderColor: isSelected ? style.accent : undefined,
                            backgroundColor: isSelected ? style.badgeBg : undefined,
                          }}
                        >
                          <StageIcon
                            name={style.iconName}
                            className="w-5 h-5"
                            style={{ color: style.accent }}
                          />
                          <span className="text-xs font-bold" style={{ color: style.textColor }}>
                            Class {parseInt(c, 10)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Middle & Boards */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#3B4FE0] bg-blue-100/80 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-[#3B4FE0]" />
                    <span>Middle & Boards (Classes 6–10)</span>
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {['06', '07', '08', '09', '10'].map((c) => {
                      const style = getClassCardStyle(c);
                      const isSelected = selectedGrade === c;
                      return (
                        <button
                          key={c}
                          onClick={() => pickGrade(c)}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            isSelected
                              ? 'ring-2 shadow-sm scale-105'
                              : 'bg-white hover:bg-[#F5F6FA] border-[#E3E5EC]'
                          }`}
                          style={{
                            borderColor: isSelected ? style.accent : undefined,
                            backgroundColor: isSelected ? style.badgeBg : undefined,
                          }}
                        >
                          <StageIcon
                            name={style.iconName}
                            className="w-5 h-5"
                            style={{ color: style.accent }}
                          />
                          <span className="text-xs font-bold" style={{ color: style.textColor }}>
                            Class {parseInt(c, 10)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Senior Secondary */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 bg-slate-200 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5">
                    <GraduationCap className="w-3 h-3 text-slate-800" />
                    <span>Senior Secondary & Entrance (Classes 11–12)</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['11', '12'].map((c) => {
                      const style = getClassCardStyle(c);
                      const isSelected = selectedGrade === c;
                      return (
                        <button
                          key={c}
                          onClick={() => pickGrade(c)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'ring-2 shadow-sm scale-102'
                              : 'bg-white hover:bg-[#F5F6FA] border-[#E3E5EC]'
                          }`}
                          style={{
                            borderColor: isSelected ? style.accent : undefined,
                            backgroundColor: isSelected ? style.badgeBg : undefined,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <StageIcon
                              name={style.iconName}
                              className="w-6 h-6"
                              style={{ color: style.accent }}
                            />
                            <div>
                              <p className="text-xs sm:text-sm font-bold" style={{ color: style.textColor }}>
                                {style.class_display}
                              </p>
                              <p className="text-[11px] text-[#6B7280]">
                                Boards, JEE & NEET Alignment
                              </p>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-[#3B4FE0]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE FOCUS SUBJECTS */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-extrabold text-[#1E2233]">
                  Select your primary subjects for Class {parseInt(selectedGrade, 10)}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  All subjects of your class stay available; focus subjects are shown first on your dashboard. Optional.
                </p>
              </div>

              {availableSubjects.length === 0 && (
                <p className="text-center text-xs text-[#6B7280] bg-[#F5F6FA] border border-dashed border-[#E3E5EC] rounded-2xl p-6">
                  Lessons for this class haven&apos;t been published yet. You can set focus subjects later in Profile.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {availableSubjects.map((subject) => {
                  const isChecked = selectedSubjects.includes(subject);
                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-[#EEEDFE] border-[#3B4FE0] text-[#26215C] shadow-2xs'
                          : 'bg-white border-[#E3E5EC] hover:bg-[#F5F6FA] text-[#1E2233]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isChecked ? 'bg-[#3B4FE0] text-white' : 'bg-[#F5F6FA] text-[#6B7280]'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold">{subject}</p>
                          <p className="text-[11px] text-[#6B7280]">NCERT Prescribed Curriculum</p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isChecked
                            ? 'bg-[#3B4FE0] border-[#3B4FE0] text-white'
                            : 'border-[#CBD5E1] bg-white'
                        }`}
                      >
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: DAILY STUDY TARGET & REMINDERS */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-extrabold text-[#1E2233]">
                  Set Your Daily Routine & Revision Reminders
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Consistency is key. Choose your daily Pomodoro target and notification schedule.
                </p>
              </div>

              {/* Target Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1E2233] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#12A594]" />
                  <span>Daily Focus Goal</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { mins: 25, label: '1 Pomodoro (25m)', sub: 'Light Brush-up' },
                    { mins: 50, label: '2 Pomodoros (50m)', sub: 'Recommended' },
                    { mins: 75, label: '3 Pomodoros (75m)', sub: 'Deep Study' },
                    { mins: 100, label: '4 Pomodoros (100m)', sub: 'Intensive Sprint' },
                  ].map((goal) => (
                    <button
                      key={goal.mins}
                      type="button"
                      onClick={() => setDailyGoal(goal.mins)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        dailyGoal === goal.mins
                          ? 'border-[#3B4FE0] bg-[#EEEDFE] text-[#3B4FE0] shadow-xs'
                          : 'border-[#E3E5EC] bg-white text-[#6B7280] hover:bg-[#F5F6FA]'
                      }`}
                    >
                      <p className="text-sm font-extrabold">{goal.mins}m</p>
                      <p className="text-[10px] font-semibold mt-0.5">{goal.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reminders Toggle & Schedule */}
              <div className="p-4 rounded-2xl border border-[#E3E5EC] bg-[#F5F6FA] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#3B4FE0]/10 text-[#3B4FE0] flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1E2233]">
                        Email revision reminders
                      </p>
                      <p className="text-[11px] text-[#6B7280]">
                        A short email with your next lesson. Change or turn off anytime from Reminders in the menu.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEnableReminders(!enableReminders)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      enableReminders ? 'bg-[#12A594]' : 'bg-[#CBD5E1]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        enableReminders ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {enableReminders && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#E3E5EC]">
                    <label
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center gap-2 ${
                        reminderFreq === 'daily'
                          ? 'border-[#3B4FE0] bg-white text-[#3B4FE0] font-bold'
                          : 'border-[#E3E5EC] bg-white text-[#6B7280]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="remind"
                        checked={reminderFreq === 'daily'}
                        onChange={() => setReminderFreq('daily')}
                        className="text-[#3B4FE0]"
                      />
                      <span>Every day</span>
                    </label>

                    <label
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center gap-2 ${
                        reminderFreq === 'weekly'
                          ? 'border-[#3B4FE0] bg-white text-[#3B4FE0] font-bold'
                          : 'border-[#E3E5EC] bg-white text-[#6B7280]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="remind"
                        checked={reminderFreq === 'weekly'}
                        onChange={() => setReminderFreq('weekly')}
                        className="text-[#3B4FE0]"
                      />
                      <span>Every Sunday</span>
                    </label>
                    <label className="sm:col-span-2 flex items-center gap-2 text-xs text-[#1E2233]">
                      <span className="font-bold">Send at</span>
                      <select
                        value={reminderHour(reminderFreq, reminderHourValue)}
                        onChange={(e) => setReminderHourValue(Number(e.target.value))}
                        className="px-2.5 py-1.5 rounded-lg border border-[#E3E5EC] bg-white text-xs focus:border-[#3B4FE0] outline-none"
                      >
                        {REMINDER_HOURS.map((h) => (
                          <option key={h} value={h}>
                            {formatHour(h)}
                          </option>
                        ))}
                      </select>
                      <span className="text-[#6B7280]">IST</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: READY / CONFIRMATION */}
          {step === 4 && (
            <div className="space-y-6 text-center animate-in fade-in duration-200 py-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-extrabold text-[#1E2233]">
                  You&apos;re All Set for NCERT Mastery!
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] max-w-md mx-auto">
                  Your distraction-free workspace is tailored and ready. Here is a summary of your revision setup:
                </p>
              </div>

              <div className="bg-[#F5F6FA] border border-[#E3E5EC] rounded-2xl p-4 text-left max-w-md mx-auto space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Your Class:</span>
                  <span className="font-bold text-[#1E2233]">Class {parseInt(selectedGrade, 10)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Focus Subjects:</span>
                  <span className="font-bold text-[#1E2233]">
                    {selectedSubjects.length === 0
                      ? 'All subjects'
                      : `${selectedSubjects.slice(0, 2).join(', ')}${
                          selectedSubjects.length > 2 ? ` +${selectedSubjects.length - 2}` : ''
                        }`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Daily Focus Goal:</span>
                  <span className="font-bold text-[#12A594]">{dailyGoal} Minutes</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Reminders:</span>
                  <span className="font-bold text-[#3B4FE0]">
                    {enableReminders ? `${reminderSummary(true, reminderFreq, reminderHourValue)} IST` : 'Off'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-4 sm:px-6 py-4 border-t border-[#E3E5EC] bg-[#F5F6FA] flex items-center justify-between gap-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#6B7280] hover:text-[#1E2233] hover:bg-white rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            hasClass ? (
              <button
                type="button"
                onClick={handleSkip}
                className="px-4 py-2 text-xs font-bold text-[#6B7280] hover:text-[#1E2233] cursor-pointer"
              >
                Skip Setup
              </button>
            ) : (
              <span className="text-[11px] text-[#6B7280]">Pick your class to continue</span>
            )
          )}

          {step < 4 ? (
            <button
              type="button"
              disabled={step === 1 && !selectedGrade}
              onClick={() => setStep((prev) => (prev + 1) as 2 | 3 | 4)}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-[#3B4FE0] hover:bg-[#2F40BD] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-[#12A594] hover:bg-[#0E8576] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Saving...' : 'Start My Revision'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
