import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Timer, Zap, Trophy } from "lucide-react";
import { Player, getRandomPlayer, players } from "@/data/players";
import { loadGameState, saveGameState } from "@/lib/gameState";
import { Silhouette } from "@/components/game/Silhouette";
import { ClubCard } from "@/components/game/ClubCard";
import { GuessInput } from "@/components/game/GuessInput";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { fireWinConfetti, hapticSuccess, hapticError, hapticLight } from "@/lib/feedback";

const TOTAL_ROUNDS = 10;
const TIME_LIMIT = 90; // seconds

export default function TimeAttackScreen() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [usedIds, setUsedIds] = useState<number[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pickNextPlayer = useCallback(() => {
    const p = getRandomPlayer(usedIds);
    setUsedIds((prev) => [...prev, p.id]);
    setCurrentPlayer(p);
    setShowResult(null);
  }, [usedIds]);

  const startGame = () => {
    setGameStarted(true);
    setRound(1);
    setScore(0);
    setCorrectCount(0);
    setTimeLeft(TIME_LIMIT);
    setUsedIds([]);
    setGameOver(false);
    const p = getRandomPlayer([]);
    setUsedIds([p.id]);
    setCurrentPlayer(p);
  };

  // Timer
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameStarted, gameOver]);

  const handleGuess = (name: string) => {
    if (!currentPlayer || gameOver) return;

    const correct = name.toLowerCase() === currentPlayer.name.toLowerCase();
    if (correct) {
      const timeBonus = Math.floor(timeLeft / 10);
      const roundScore = 50 + timeBonus;
      setScore((s) => s + roundScore);
      setCorrectCount((c) => c + 1);
      setShowResult("correct");
      hapticSuccess();
      toast.success(`+${roundScore} pts!`);
    } else {
      setShowResult("wrong");
      hapticError();
      toast.error(`It was ${currentPlayer.name}`);
    }

    // Move to next round after brief delay
    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        setGameOver(true);
      } else {
        setRound((r) => r + 1);
        pickNextPlayer();
      }
    }, 800);
  };

  const handleSkip = () => {
    if (!currentPlayer || gameOver) return;
    toast.error(`Skipped: ${currentPlayer.name}`);
    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        setGameOver(true);
      } else {
        setRound((r) => r + 1);
        pickNextPlayer();
      }
    }, 400);
  };

  // Save results when game over
  useEffect(() => {
    if (!gameOver || !gameStarted) return;
    if (correctCount >= 5) fireWinConfetti();
    const state = loadGameState();
    const goldReward = Math.floor(score / 10);
    const newState = { ...state, coins: state.coins + goldReward };
    saveGameState(newState);

    if (user && profile) {
      updateProfile({
        total_score: (profile.total_score || 0) + score,
        total_played: (profile.total_played || 0) + TOTAL_ROUNDS,
        total_correct: (profile.total_correct || 0) + correctCount,
        coins: (profile.coins || 0) + goldReward,
      });
    }
  }, [gameOver]);

  const visibleClubs = useMemo(() => {
    if (!currentPlayer) return [];
    return currentPlayer.careerClubs.slice(0, 3).map((club, i) => ({
      club,
      countryCode: currentPlayer.clubCountryCodes[i] || "XX",
    }));
  }, [currentPlayer]);

  const timerPercent = (timeLeft / TIME_LIMIT) * 100;
  const timerColor = timeLeft <= 15 ? "bg-destructive" : timeLeft <= 30 ? "bg-accent" : "bg-primary";

  // Pre-game screen
  if (!gameStarted) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="min-h-screen bg-background safe-top safe-bottom flex flex-col items-center justify-center px-6 gap-8"
      >
        <div className="text-center space-y-4">
          <Timer className="w-16 h-16 mx-auto text-accent" />
          <h1 className="font-display font-black text-3xl text-foreground">Time Attack</h1>
          <p className="text-sm text-muted-foreground font-body max-w-xs">
            Guess {TOTAL_ROUNDS} players in {TIME_LIMIT} seconds. Faster answers = more points!
          </p>
        </div>
        <button
          onClick={startGame}
          className="w-full max-w-xs rounded-2xl bg-accent py-4 font-display font-bold text-accent-foreground text-lg glow-gold"
        >
          Start!
        </button>
        <button
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground font-body"
        >
          Back to Home
        </button>
      </motion.div>
    );
  }

  // Game Over screen
  if (gameOver) {
    const goldReward = Math.floor(score / 10);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-background safe-top safe-bottom flex flex-col items-center justify-center px-6 gap-6"
      >
        <Trophy className="w-16 h-16 text-accent" />
        <h1 className="font-display font-black text-3xl text-foreground">Time's Up!</h1>
        <div className="text-center space-y-2">
          <p className="font-display font-bold text-4xl text-accent">{score}</p>
          <p className="text-sm text-muted-foreground font-body">points</p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <p className="font-display font-bold text-lg text-primary">{correctCount}/{TOTAL_ROUNDS}</p>
            <p className="text-[10px] text-muted-foreground font-body">Correct</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <p className="font-display font-bold text-lg text-accent">+{goldReward}</p>
            <p className="text-[10px] text-muted-foreground font-body">Gold earned</p>
          </div>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={startGame}
            className="flex-1 rounded-2xl bg-accent py-3 font-display font-bold text-sm text-accent-foreground"
          >
            Play Again
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 rounded-2xl bg-secondary border border-border py-3 font-display font-bold text-sm text-foreground"
          >
            Home
          </button>
        </div>
      </motion.div>
    );
  }

  // Active game
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen bg-background safe-top safe-bottom flex flex-col"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm text-muted-foreground">
            {round}/{TOTAL_ROUNDS}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <span className="font-display font-bold text-sm text-accent">{score}</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="px-4 pb-2">
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${timerColor}`}
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground font-body">
            {timeLeft}s left
          </span>
        </div>
      </div>

      {/* Player */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        <AnimatePresence mode="wait">
          {currentPlayer && (
            <motion.div
              key={currentPlayer.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="flex justify-center py-2">
                <Silhouette
                  player={currentPlayer}
                  revealed={showResult === "correct" || showResult === "wrong"}
                />
              </div>

              {showResult && (
                <div className={`text-center font-display font-bold text-sm ${
                  showResult === "correct" ? "text-primary" : "text-destructive"
                }`}>
                  {currentPlayer.name}
                </div>
              )}

              <div className="space-y-2">
                {visibleClubs.map((c, i) => (
                  <ClubCard key={i} club={c.club} countryCode={c.countryCode} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input + Skip */}
      {!showResult && (
        <div className="px-4 pb-6 pt-2 border-t border-border bg-background space-y-2">
          <GuessInput onGuess={handleGuess} disabled={!!showResult} />
          <button
            onClick={handleSkip}
            className="w-full py-2 text-xs text-muted-foreground font-body hover:text-foreground transition-colors"
          >
            Skip →
          </button>
        </div>
      )}
    </motion.div>
  );
}
