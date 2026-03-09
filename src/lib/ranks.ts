/**
 * Centralized rank system for player progression
 */

export interface RankInfo {
  label: string;
  icon: string;
  minXP: number;
  color: string;
  bg: string;
  benefits: string[];
}

export const RANKS: RankInfo[] = [
  {
    label: "Rookie",
    icon: "🌱",
    minXP: 0,
    color: "text-slate-600",
    bg: "bg-slate-100",
    benefits: ["Start your football guessing journey", "Basic game access"]
  },
  {
    label: "Amateur",
    icon: "⚽",
    minXP: 500,
    color: "text-green-600",
    bg: "bg-green-100",
    benefits: ["Daily challenge access", "Hint cost reduced by 5%"]
  },
  {
    label: "Semi-Pro",
    icon: "🥈",
    minXP: 1500,
    color: "text-blue-600",
    bg: "bg-blue-100",
    benefits: ["Weekly bonus XP: +50", "Hint cost reduced by 10%", "Special badge display"]
  },
  {
    label: "Pro",
    icon: "🏆",
    minXP: 3500,
    color: "text-purple-600",
    bg: "bg-purple-100",
    benefits: ["Daily bonus XP: +25", "Weekly bonus XP: +100", "Hint cost reduced by 15%"]
  },
  {
    label: "Elite",
    icon: "⭐",
    minXP: 7000,
    color: "text-amber-600",
    bg: "bg-amber-100",
    benefits: ["Daily bonus XP: +50", "Weekly bonus XP: +200", "Exclusive challenges", "Priority leaderboard"]
  },
  {
    label: "Legend",
    icon: "👑",
    minXP: 15000,
    color: "text-rose-600",
    bg: "bg-rose-100",
    benefits: ["Daily bonus XP: +100", "Weekly bonus XP: +500", "Legend badge", "Access to all features", "Highest rank achieved!"]
  }
];

/**
 * Get current rank based on XP
 */
export function getRank(xp: number): RankInfo {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) {
      return RANKS[i];
    }
  }
  return RANKS[0]; // Fallback to Rookie
}

/**
 * Get next rank in progression
 */
export function getNextRank(xp: number): RankInfo | null {
  const currentRank = getRank(xp);
  const currentIndex = RANKS.findIndex(r => r.minXP === currentRank.minXP);
  return currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
}

/**
 * Check if user has ranked up
 */
export function hasRankUp(oldXP: number, newXP: number): RankInfo | null {
  const oldRank = getRank(oldXP);
  const newRank = getRank(newXP);
  return oldRank.minXP < newRank.minXP ? newRank : null;
}

/**
 * Calculate XP progress within current rank
 */
export function getRankProgress(xp: number) {
  const currentRank = getRank(xp);
  const nextRank = getNextRank(xp);
  
  if (!nextRank) {
    return { 
      currentRank, 
      nextRank: null,
      xpProgress: 0, 
      xpNeeded: 0, 
      progressPercent: 100 
    };
  }
  
  const currentRankMinXP = currentRank.minXP;
  const nextRankMinXP = nextRank.minXP;
  const xpProgress = xp - currentRankMinXP;
  const xpNeeded = nextRankMinXP - xp;
  const progressPercent = (xpProgress / (nextRankMinXP - currentRankMinXP)) * 100;
  
  return {
    currentRank,
    nextRank,
    xpProgress,
    xpNeeded,
    progressPercent: Math.min(100, Math.max(0, progressPercent))
  };
}

/**
 * Get rank bonus multipliers for daily/weekly bonuses
 */
export function getRankBonuses(rank: RankInfo) {
  const bonuses = { daily: 0, weekly: 0 };
  
  switch (rank.label) {
    case "Amateur":
      bonuses.weekly = 50;
      break;
    case "Semi-Pro":
      bonuses.weekly = 50;
      break;
    case "Pro":
      bonuses.daily = 25;
      bonuses.weekly = 100;
      break;
    case "Elite":
      bonuses.daily = 50;
      bonuses.weekly = 200;
      break;
    case "Legend":
      bonuses.daily = 100;
      bonuses.weekly = 500;
      break;
  }
  
  return bonuses;
}