import { Player } from "@/data/players";

export interface GameState {
  coins: number;
  streak: number;
  bestStreak: number;
  totalCorrect: number;
  totalPlayed: number;
  lastDailyDate: string | null;
  dailyCompleted: boolean;
  dailyGuesses: string[];
  dailyWon: boolean;
  playedPlayerIds: number[];
  hintsUsed: { letter: boolean; country: boolean; position: boolean; club: boolean };
}

const DEFAULT_STATE: GameState = {
  coins: 100,
  streak: 0,
  bestStreak: 0,
  totalCorrect: 0,
  totalPlayed: 0,
  lastDailyDate: null,
  dailyCompleted: false,
  dailyGuesses: [],
  dailyWon: false,
  playedPlayerIds: [],
  hintsUsed: { letter: false, country: false, position: false, club: false },
};

const STORAGE_KEY = "gtf_game_state";

export function loadGameState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveGameState(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function resetDailyIfNeeded(state: GameState): GameState {
  const today = getTodayStr();
  if (state.lastDailyDate !== today) {
    // Check streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    
    const newStreak = state.lastDailyDate === yesterdayStr && state.dailyWon ? state.streak : 0;
    
    return {
      ...state,
      dailyCompleted: false,
      dailyGuesses: [],
      dailyWon: false,
      lastDailyDate: today,
      streak: newStreak,
      hintsUsed: { letter: false, country: false, position: false, club: false },
    };
  }
  return state;
}

export function generateShareText(
  puzzleNumber: number,
  guesses: string[],
  won: boolean,
  player: Player
): string {
  const blocks = guesses.map((g, i) => {
    if (won && i === guesses.length - 1) return "🟩";
    return "⬛";
  });
  
  const clubFlags = player.clubCountryCodes
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 5)
    .map((c) => {
      return c.toUpperCase().split("").map((ch) => String.fromCodePoint(ch.charCodeAt(0) + 127397)).join("");
    })
    .join(" ");

  return `⚽ Guess The Footballer #${puzzleNumber}\n\n${blocks.join("")}\n\nClubs: ${clubFlags}\n\nPlay now!`;
}

// Hint costs
export const HINT_COSTS = {
  letter: 30,
  country: 20,
  position: 15,
  club: 40,
} as const;

// Skip (show answer) system
const SKIP_STORAGE_KEY = "gtf_skip_uses";
export const MAX_FREE_SKIPS = 5;
export const SKIP_PURCHASE_PRICE = "₺9.99";

export function getSkipUsesLeft(): number {
  const used = parseInt(localStorage.getItem(SKIP_STORAGE_KEY) || "0");
  return Math.max(0, MAX_FREE_SKIPS - used);
}

export function consumeSkipUse(): void {
  const used = parseInt(localStorage.getItem(SKIP_STORAGE_KEY) || "0");
  localStorage.setItem(SKIP_STORAGE_KEY, String(used + 1));
}

export function resetSkipUses(): void {
  localStorage.setItem(SKIP_STORAGE_KEY, "0");
}

export function addSkipCredit(count = 1): void {
  const used = parseInt(localStorage.getItem(SKIP_STORAGE_KEY) || "0");
  localStorage.setItem(SKIP_STORAGE_KEY, String(Math.max(0, used - count)));
}

// Scoring
export function calculateScore(guessNumber: number, hintsUsed: number): number {
  let score = 100;
  if (guessNumber === 1) score += 200;
  else if (guessNumber === 2) score += 100;
  else if (guessNumber === 3) score += 50;
  if (hintsUsed === 0) score += 150;
  return score;
}
