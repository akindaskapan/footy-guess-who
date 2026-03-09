import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Player, getRandomPlayer } from "@/data/players";
import {
  loadGameState,
  saveGameState,
  calculateScore,
  calculateEarnedCoins,
  HINT_COSTS,
} from "@/lib/gameState";
import { Silhouette } from "@/components/game/Silhouette";
import { GuessInput } from "@/components/game/GuessInput";
import { GuessHistory } from "@/components/game/GuessHistory";
import { ShareCard } from "@/components/game/ShareCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { fireWinConfetti, hapticSuccess, hapticError } from "@/lib/feedback";
import { hasRankUp, getRank } from "@/lib/ranks";
import { RankUpModal } from "@/components/RankUpModal";

const MAX_GUESSES = 5;
const MYSTERY_BONUS = 2; // 2x rewards

export default function MysteryScreen() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();

  const [gameState, setGameState] = useState(loadGameState);
  const [player] = useState<Player>(() => getRandomPlayer(gameState.playedPlayerIds));
  const [guesses, setGuesses] = useState<string[]>([]);
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [rankUpModal, setRankUpModal] = useState<{ isOpen: boolean; newRank: any; oldRank: any }>({ 
    isOpen: false, 
    newRank: null, 
    oldRank: null 
  });

  const puzzleNumber = useMemo(() => Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 9999, []);

  const revealedName = useMemo(() => {
    if (!hintRevealed) return "";
    const name = player.name;
    return name
      .split("")
      .map((ch, i) => {
        if (ch === " ") return " ";
        if (i === 0 || i === name.length - 1) return ch;
        return "_";
      })
      .join("");
  }, [player, hintRevealed]);

  const handleGuess = (name: string) => {
    if (gameOver || guesses.length >= MAX_GUESSES) return;

    const newGuesses = [...guesses, name];
    setGuesses(newGuesses);

    const correct = name.toLowerCase() === player.name.toLowerCase();
    if (correct) {
      setWon(true);
      setGameOver(true);
      const baseXp = calculateScore(newGuesses.length, hintRevealed ? 1 : 0);
      const xpGained = baseXp * MYSTERY_BONUS;
      const coinsGained = calculateEarnedCoins(newGuesses.length, hintRevealed ? 1 : 0) * MYSTERY_BONUS;
      const newState = {
        ...gameState,
        coins: gameState.coins + coinsGained,
        totalCorrect: gameState.totalCorrect + 1,
        totalPlayed: gameState.totalPlayed + 1,
        playedPlayerIds: [...gameState.playedPlayerIds, player.id],
      };
      saveGameState(newState);
      setGameState(newState);

      if (user && profile) {
        const oldXP = profile.total_score || 0;
        const updates = {
          total_score: oldXP + xpGained,
          total_played: (profile.total_played || 0) + 1,
          total_correct: (profile.total_correct || 0) + 1,
          coins: (profile.coins || 0) + coinsGained,
        };
        
        // Check for rank up
        const newXP = oldXP + xpGained;
        const rankUpInfo = hasRankUp(oldXP, newXP);
        if (rankUpInfo) {
          const oldRank = getRank(oldXP);
          setRankUpModal({ isOpen: true, newRank: rankUpInfo, oldRank });
        }
        
        updateProfile(updates);
        supabase.from("game_results").insert({
          user_id: user.id,
          player_id: player.id,
          mode: "mystery",
          guesses: newGuesses.length,
          hints_used: hintRevealed ? 1 : 0,
          score: xpGained,
          won: true,
        });
      }
      fireWinConfetti();
      hapticSuccess();
      toast.success(`+${xpGained} XP, +${coinsGained} coins! (2x Mystery Bonus) 🎉`);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      const newState = {
        ...gameState,
        totalPlayed: gameState.totalPlayed + 1,
        playedPlayerIds: [...gameState.playedPlayerIds, player.id],
      };
      saveGameState(newState);
      setGameState(newState);

      if (user && profile) {
        updateProfile({ total_played: (profile.total_played || 0) + 1 });
        supabase.from("game_results").insert({
          user_id: user.id,
          player_id: player.id,
          mode: "mystery",
          guesses: newGuesses.length,
          hints_used: hintRevealed ? 1 : 0,
          score: 0,
          won: false,
        });
      }
      hapticError();
      toast.error(`The answer was ${player.name}`);
    } else {
      hapticError();
      toast.error("Wrong! Try again");
    }
  };

  const handleRevealHint = () => {
    if (hintRevealed || gameState.coins < 60) return;
    setHintRevealed(true);
    const newState = { ...gameState, coins: gameState.coins - 60 };
    saveGameState(newState);
    setGameState(newState);
    toast.success("First & last letters revealed!");
  };

  const handlePlayAgain = () => window.location.reload();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background safe-top safe-bottom flex flex-col"
    >
      {/* Header */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-destructive" />
          <h2 className="font-display font-bold text-sm text-foreground uppercase tracking-wider">
            Mystery Mode
          </h2>
        </div>
        <div className="flex items-center gap-1 text-accent">
          <span className="font-display font-bold text-sm">
            {profile?.coins ?? gameState.coins}
          </span>
          <span>💎</span>
        </div>
      </div>

      {/* 2x badge */}
      <div className="px-4 pb-2">
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-2 text-center">
          <p className="text-xs font-display font-bold text-destructive">
            🔥 No Club Clues · 2x Rewards
          </p>
        </div>
      </div>

      {/* Guess dots */}
      <div className="px-4 py-3">
        <GuessHistory guesses={guesses} correctName={player.name} maxGuesses={MAX_GUESSES} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        <div className="flex justify-center py-4">
          <Silhouette player={player} revealed={gameOver} />
        </div>

        {/* Only hint: nationality (expensive) */}
        {!gameOver && (
          <div className="space-y-3">
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider text-center">
              No clubs shown. Only the silhouette!
            </p>

            {hintRevealed && revealedName && (
              <div className="text-center">
                <p className="font-display font-bold text-lg text-accent tracking-widest">
                  {revealedName}
                </p>
              </div>
            )}

            {!hintRevealed && (
              <button
                onClick={handleRevealHint}
                disabled={gameState.coins < 60}
                className="w-full rounded-xl bg-card border border-border p-3 flex items-center justify-between disabled:opacity-40"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-accent" />
                  <span className="font-display font-semibold text-sm text-foreground">
                    Reveal Letters
                  </span>
                </div>
                <span className="font-display font-bold text-sm text-accent">60 💎</span>
              </button>
            )}

            {/* Show country after 3 wrong guesses */}
            {guesses.length >= 3 && (
              <p className="text-center text-sm text-muted-foreground font-body">
                Country: <span className="text-foreground font-display font-bold">{player.country}</span>
              </p>
            )}
          </div>
        )}

        {/* Game over */}
        {gameOver && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl bg-card border border-border p-6 text-center space-y-4"
          >
            {won ? (
              <>
                <p className="text-3xl">🎉</p>
                <p className="font-display font-bold text-xl text-foreground">
                  Mystery Solved in {guesses.length}!
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl">😔</p>
                <p className="font-display font-bold text-xl text-foreground">
                  It was {player.name}
                </p>
              </>
            )}

            <ShareCard
              puzzleNumber={puzzleNumber}
              guesses={guesses}
              won={won}
              player={player}
              mode="mystery"
              hintsUsed={hintRevealed ? 1 : 0}
            />

            <button
              onClick={handlePlayAgain}
              className="rounded-xl bg-accent px-6 py-2.5 font-display font-semibold text-sm text-accent-foreground"
            >
              Play Again
            </button>
          </motion.div>
        )}
      </div>

      {/* Input */}
      {!gameOver && (
        <div className="px-4 pb-6 pt-2 border-t border-border bg-background">
          <GuessInput onGuess={handleGuess} disabled={gameOver} />
        </div>
      )}

      {/* Rank Up Modal */}
      <RankUpModal
        isOpen={rankUpModal.isOpen}
        onClose={() => setRankUpModal({ isOpen: false, newRank: null, oldRank: null })}
        newRank={rankUpModal.newRank}
        oldRank={rankUpModal.oldRank}
      />
    </motion.div>
  );
}
