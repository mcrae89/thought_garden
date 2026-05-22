/** Returns current streak length given sorted array of ISO date strings (YYYY-MM-DD). */
export function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  // Streak must include today or yesterday to be active
  if (sorted[0] !== today && sorted[0] !== getPreviousDay(today)) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === getPreviousDay(sorted[i - 1])) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getPreviousDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
