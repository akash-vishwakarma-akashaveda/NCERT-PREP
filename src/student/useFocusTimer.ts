import { useEffect, useState } from 'react';

export type FocusMode = 'focus' | 'short' | 'long';

export const FOCUS_DURATIONS: Record<FocusMode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };

// Lives in the student layout so a running session survives page changes.
export function useFocusTimer() {
  const [mode, setMode] = useState<FocusMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && secondsLeft === 0) {
      setRunning(false);
      if (mode === 'focus') setSessionsToday((n) => n + 1);
    }
  }, [running, secondsLeft, mode]);

  const selectMode = (next: FocusMode) => {
    setRunning(false);
    setMode(next);
    setSecondsLeft(FOCUS_DURATIONS[next]);
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(FOCUS_DURATIONS[mode]);
  };

  const label = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return {
    mode,
    secondsLeft,
    total: FOCUS_DURATIONS[mode],
    running,
    sessionsToday,
    label,
    selectMode,
    reset,
    toggle: () => setRunning((r) => (secondsLeft === 0 ? r : !r)),
  };
}

export type FocusTimer = ReturnType<typeof useFocusTimer>;
