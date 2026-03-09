import { useCallback } from "react";
import { toast } from "sonner";
import { 
  loadChallengeState, 
  saveChallengeState, 
  updateChallenges, 
  updateChallengeProgress,
  getAvailableRewards 
} from "@/lib/challenges";
import { loadGameState, saveGameState } from "@/lib/gameState";

interface GameResult {
  won: boolean;
  guesses: number;
  hintsUsed: number;
  mode: "classic" | "timeattack" | "mystery";
  xpGained: number;
}

export function useChallengeTracker() {
  const trackGameResult = useCallback((result: GameResult) => {
    // Load and update challenge state
    let challengeState = updateChallenges(loadChallengeState());
    let gameState = loadGameState();
    
    // Track basic game completion
    challengeState = updateChallengeProgress(challengeState, "games_played", 1);
    
    // Track correct guesses
    if (result.won) {
      challengeState = updateChallengeProgress(challengeState, "correct_guesses", 1);
      
      // Track perfect games (won in 1 guess)
      if (result.guesses === 1) {
        challengeState = updateChallengeProgress(challengeState, "perfect_games", 1);
      }
    }
    
    // Track hint usage (count games where no hints were used)
    if (result.hintsUsed === 0 && result.won) {
      challengeState = updateChallengeProgress(challengeState, "hint_usage", 1);
    }
    
    // Track total XP
    challengeState = updateChallengeProgress(challengeState, "total_xp", result.xpGained);
    
    // Track game variety (unique modes played this week)
    const currentModes = challengeState.weeklyProgress.game_variety_modes || [];
    if (!currentModes.includes(result.mode)) {
      const newModes = [...currentModes, result.mode];
      challengeState.weeklyProgress.game_variety_modes = newModes;
      challengeState = updateChallengeProgress(challengeState, "total_xp", newModes.length); // Use total_xp as proxy
    }
    
    // Update streak tracking
    if (result.won) {
      gameState.streak = (gameState.streak || 0) + 1;
      if (gameState.streak > (gameState.bestStreak || 0)) {
        gameState.bestStreak = gameState.streak;
      }
      challengeState = updateChallengeProgress(challengeState, "streak", gameState.streak);
    } else {
      gameState.streak = 0;
    }
    
    // Save updated states
    saveChallengeState(challengeState);
    saveGameState(gameState);
    
    // Check for completed challenges and notify user
    const rewards = getAvailableRewards(challengeState);
    const completedChallenges = [
      ...challengeState.dailyChallenges.filter(c => c.completed),
      ...challengeState.weeklyChallenges.filter(c => c.completed)
    ];
    
    if (completedChallenges.length > 0) {
      const totalReward = rewards.daily + rewards.weekly;
      toast.success(
        `🎯 Challenge completed! +${totalReward} XP available!`,
        {
          action: {
            label: "Claim Rewards",
            onClick: () => window.location.href = "/challenges"
          }
        }
      );
    }
    
  }, []);

  return { trackGameResult };
}