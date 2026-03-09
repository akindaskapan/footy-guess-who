/**
 * Daily/Weekly Challenge and XP Bonus System
 */

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  type: "games_played" | "correct_guesses" | "streak" | "perfect_games" | "hint_usage";
  completed?: boolean;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  type: "total_xp" | "daily_streak" | "perfect_week" | "game_variety" | "leaderboard_climb";
  completed?: boolean;
}

export interface ChallengeState {
  lastClaimDate: string;
  lastWeeklyClaimDate: string;
  dailyChallenges: DailyChallenge[];
  weeklyChallenges: WeeklyChallenge[];
  weeklyProgress: Record<string, any>;
  dailyProgress: Record<string, any>;
}

// Generate daily challenges based on date
export function generateDailyChallenges(date: Date): DailyChallenge[] {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const seed = dayOfYear % 5; // Rotate through 5 different challenge sets
  
  const challengeSets = [
    [
      { id: "daily_games_3", title: "Warm Up", description: "Play 3 games", target: 3, reward: 50, type: "games_played" as const },
      { id: "daily_correct_2", title: "Sharp Shooter", description: "Get 2 correct guesses", target: 2, reward: 75, type: "correct_guesses" as const },
      { id: "daily_perfect_1", title: "First Try Hero", description: "Get 1 perfect guess (1 try)", target: 1, reward: 100, type: "perfect_games" as const },
    ],
    [
      { id: "daily_streak_3", title: "On Fire", description: "Maintain a 3-day streak", target: 3, reward: 150, type: "streak" as const },
      { id: "daily_games_5", title: "Dedicated", description: "Play 5 games", target: 5, reward: 80, type: "games_played" as const },
      { id: "daily_hints_minimal", title: "Intuitive", description: "Use 2 or fewer hints", target: 2, reward: 60, type: "hint_usage" as const },
    ],
    [
      { id: "daily_correct_5", title: "Sharpshooter", description: "Get 5 correct guesses", target: 5, reward: 120, type: "correct_guesses" as const },
      { id: "daily_perfect_2", title: "Double Perfect", description: "Get 2 perfect games", target: 2, reward: 200, type: "perfect_games" as const },
      { id: "daily_games_4", title: "Consistent", description: "Play 4 games", target: 4, reward: 60, type: "games_played" as const },
    ],
    [
      { id: "daily_no_hints", title: "Pure Instinct", description: "Win without using hints", target: 1, reward: 150, type: "hint_usage" as const },
      { id: "daily_correct_3", title: "Triple Threat", description: "Get 3 correct guesses", target: 3, reward: 90, type: "correct_guesses" as const },
      { id: "daily_games_6", title: "Marathon", description: "Play 6 games", target: 6, reward: 100, type: "games_played" as const },
    ],
    [
      { id: "daily_streak_5", title: "Burning Streak", description: "Maintain a 5-day streak", target: 5, reward: 250, type: "streak" as const },
      { id: "daily_perfect_3", title: "Hat Trick Perfect", description: "Get 3 perfect games", target: 3, reward: 300, type: "perfect_games" as const },
      { id: "daily_correct_4", title: "Quad Success", description: "Get 4 correct guesses", target: 4, reward: 110, type: "correct_guesses" as const },
    ]
  ];

  return challengeSets[seed];
}

// Generate weekly challenges
export function generateWeeklyChallenges(): WeeklyChallenge[] {
  return [
    {
      id: "weekly_xp_1000",
      title: "XP Collector",
      description: "Earn 1,000 XP this week",
      target: 1000,
      reward: 500,
      type: "total_xp"
    },
    {
      id: "weekly_daily_streak",
      title: "Daily Devotee",
      description: "Complete daily challenges for 5 days",
      target: 5,
      reward: 400,
      type: "daily_streak"
    },
    {
      id: "weekly_variety",
      title: "Mode Master",
      description: "Play all 4 game modes this week",
      target: 4,
      reward: 300,
      type: "game_variety"
    },
    {
      id: "weekly_leaderboard",
      title: "Climb the Ranks",
      description: "Move up 3 positions on leaderboard",
      target: 3,
      reward: 600,
      type: "leaderboard_climb"
    }
  ];
}

// Load challenge state from localStorage
export function loadChallengeState(): ChallengeState {
  try {
    const saved = localStorage.getItem("gtf_challenge_state");
    if (saved) {
      const state = JSON.parse(saved) as ChallengeState;
      // Ensure all required properties exist
      return {
        lastClaimDate: state.lastClaimDate || "",
        lastWeeklyClaimDate: state.lastWeeklyClaimDate || "",
        dailyChallenges: state.dailyChallenges || [],
        weeklyChallenges: state.weeklyChallenges || [],
        weeklyProgress: state.weeklyProgress || {},
        dailyProgress: state.dailyProgress || {}
      };
    }
  } catch (error) {
    console.warn("Failed to load challenge state:", error);
  }

  return {
    lastClaimDate: "",
    lastWeeklyClaimDate: "",
    dailyChallenges: [],
    weeklyChallenges: [],
    weeklyProgress: {},
    dailyProgress: {}
  };
}

// Save challenge state to localStorage
export function saveChallengeState(state: ChallengeState): void {
  try {
    localStorage.setItem("gtf_challenge_state", JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to save challenge state:", error);
  }
}

// Get today's date string
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Get this week's date string
export function getThisWeekString(): string {
  const now = new Date();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  return startOfWeek.toISOString().split('T')[0];
}

// Check if challenges need reset and update them
export function updateChallenges(state: ChallengeState): ChallengeState {
  const today = getTodayDateString();
  const thisWeek = getThisWeekString();
  let newState = { ...state };

  // Reset daily challenges if new day
  if (state.lastClaimDate !== today) {
    newState.dailyChallenges = generateDailyChallenges(new Date());
    newState.dailyProgress = {};
    newState.lastClaimDate = today;
  }

  // Reset weekly challenges if new week
  if (state.lastWeeklyClaimDate !== thisWeek) {
    newState.weeklyChallenges = generateWeeklyChallenges();
    newState.weeklyProgress = {};
    newState.lastWeeklyClaimDate = thisWeek;
  }

  return newState;
}

// Update challenge progress
export function updateChallengeProgress(
  state: ChallengeState,
  type: "games_played" | "correct_guesses" | "streak" | "perfect_games" | "hint_usage" | "total_xp",
  value: number
): ChallengeState {
  const newState = { ...state };

  // Update daily progress
  newState.dailyProgress = { ...state.dailyProgress };
  newState.dailyProgress[type] = (newState.dailyProgress[type] || 0) + value;

  // Update weekly progress
  newState.weeklyProgress = { ...state.weeklyProgress };
  newState.weeklyProgress[type] = (newState.weeklyProgress[type] || 0) + value;

  // Mark challenges as completed if targets met
  newState.dailyChallenges = state.dailyChallenges.map(challenge => ({
    ...challenge,
    completed: challenge.completed || (newState.dailyProgress[challenge.type] || 0) >= challenge.target
  }));

  newState.weeklyChallenges = state.weeklyChallenges.map(challenge => ({
    ...challenge,
    completed: challenge.completed || (newState.weeklyProgress[challenge.type] || 0) >= challenge.target
  }));

  return newState;
}

// Get available rewards
export function getAvailableRewards(state: ChallengeState): { daily: number; weekly: number } {
  const dailyReward = state.dailyChallenges
    .filter(c => c.completed)
    .reduce((sum, c) => sum + c.reward, 0);
    
  const weeklyReward = state.weeklyChallenges
    .filter(c => c.completed)
    .reduce((sum, c) => sum + c.reward, 0);

  return { daily: dailyReward, weekly: weeklyReward };
}

// Claim completed challenge rewards
export function claimRewards(state: ChallengeState): { state: ChallengeState; totalReward: number } {
  const rewards = getAvailableRewards(state);
  const totalReward = rewards.daily + rewards.weekly;

  if (totalReward === 0) {
    return { state, totalReward: 0 };
  }

  const newState = { ...state };
  
  // Mark claimed challenges as no longer completed (so they don't show as claimable again)
  newState.dailyChallenges = state.dailyChallenges.map(c => ({ ...c, completed: false }));
  newState.weeklyChallenges = state.weeklyChallenges.map(c => ({ ...c, completed: false }));

  return { state: newState, totalReward };
}