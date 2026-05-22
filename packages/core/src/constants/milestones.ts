import type { Theme } from './plants';

export type MilestoneType =
  | 'first_entry_ever'
  | 'first_entry_theme'
  | 'third_entry_theme'
  | 'seventh_entry_theme'
  | 'fifteenth_entry_theme'
  | 'streak_7'
  | 'streak_30'
  | 'return_after_gap';

export interface MilestoneCheck {
  type: MilestoneType;
  /** Entry count for this theme (if theme-based) */
  themeCount?: number;
  /** Total entries ever */
  totalEntries?: number;
  /** Current streak length */
  streakDays?: number;
  /** Days since last entry */
  daysSinceLastEntry?: number;
  /** Dominant theme for streak bonus */
  dominantTheme?: Theme;
}

export interface MilestoneResult {
  earned: boolean;
  milestoneType: MilestoneType;
  isRare: boolean;
}

/** Returns which milestone (if any) is triggered by the given check. */
export function checkMilestone(check: MilestoneCheck): MilestoneResult | null {
  const { type } = check;

  switch (type) {
    case 'first_entry_ever':
      return { earned: true, milestoneType: type, isRare: false };

    case 'first_entry_theme':
      return { earned: true, milestoneType: type, isRare: false };

    case 'third_entry_theme':
      return check.themeCount === 3
        ? { earned: true, milestoneType: type, isRare: false }
        : null;

    case 'seventh_entry_theme':
      return check.themeCount === 7
        ? { earned: true, milestoneType: type, isRare: true }
        : null;

    case 'fifteenth_entry_theme':
      return check.themeCount === 15
        ? { earned: true, milestoneType: type, isRare: true }
        : null;

    case 'streak_7':
      return check.streakDays === 7
        ? { earned: true, milestoneType: type, isRare: false }
        : null;

    case 'streak_30':
      return check.streakDays === 30
        ? { earned: true, milestoneType: type, isRare: true }
        : null;

    case 'return_after_gap':
      return (check.daysSinceLastEntry ?? 0) >= 7
        ? { earned: true, milestoneType: type, isRare: false }
        : null;

    default:
      return null;
  }
}
