import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Share2 } from "lucide-react";
import { Player, getDailyPlayer, getRandomPlayer } from "@/data/players";
import {
  GameState,
  loadGameState,
  saveGameState,
  resetDailyIfNeeded,
  generateShareText,
  HINT_COSTS,
  calculateScore,
  getTodayStr,
} from "@/lib/gameState";
import { Silhouette } from "@/components/game/Silhouette";
import { ClubCard } from "@/components/game/ClubCard";
import { GuessInput } from "@/components/game/GuessInput";
import { GuessHistory } from "@/components/game/GuessHistory";
import { HintsPanel } from "@/components/game/HintsPanel";
import { toast } from "sonner";

const MAX_GUESSES = 5;

export default function GameScreen() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const isDaily = mode === "daily";
  const isHardcore = mode === "hardcore";

  const [gameState, setGameState] = useState<GameState>(() => {
    const s = loadGameState();
    return isDaily ? resetDailyIfNeeded(s) : s;
  });

  const [guesses, setGuesses] = useState<string[]>(isDaily ? gameState.dailyGuesses : []);
  const [won, setWon] = useState(isDaily ? gameState.dailyWon : false);
  const [gameOver, setGameOver] = useState(
    isDaily ? gameState.dailyCompleted : false
  );
  const [hintsUsed, setHintsUsed] = useState(
    isDaily ? gameState.hintsUsed : { letter: false, country: false, position: false, club: false }
  );

  const player = useMemo<Player>(() => {
    if (isDaily) return getDailyPlayer();
    return getRandomPlayer(gameState.playedPlayerIds);
  }, [isDaily]);

  // Clubs to show: in hardcore, show fewer
  const visibleClubs = useMemo(() => {
    const clubs = player.careerClubs.map((club, i) => ({
      club,
      countryCode: player.clubCountryCodes[i] || "XX",
    }));
    if (isHardcore) return clubs.slice(0, 2);
    return clubs.slice(0, 4);
  }, [player, isHardcore]);

  // Revealed name for letter hint
  const revealedName = useMemo(() => {
    if (!hintsUsed.letter) return "";
    const name = player.name;
    return name
      .split("")
      .map((ch, i) => {
        if (ch === " ") return " ";
        if (i === 0 || i === name.length - 1) return ch;
        if (i % 3 === 0) return ch;
        return "_";
      })
      .join("");
  }, [player, hintsUsed.letter]);

  const puzzleNumber = useMemo(() => {
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return daysSinceEpoch % 9999;
  }, []);

  // Persist daily state
  useEffect(() => {
    if (isDaily) {
      const updated: GameState = {
        ...gameState,
        dailyGuesses: guesses,
        dailyWon: won,
        dailyCompleted: gameOver,
        hintsUsed,
        lastDailyDate: getTodayStr(),
      };
      saveGameState(updated);
      setGameState(updated);
    }
  }, [guesses, won, gameOver, hintsUsed]);

  const handleGuess = (name: string) => {
    if (gameOver || guesses.length >= MAX_GUESSES) return;

    const newGuesses = [...guesses, name];
    setGuesses(newGuesses);

    const correct = name.toLowerCase() === player.name.toLowerCase();
    if (correct) {
      setWon(true);
      setGameOver(true);
      const hintCount = Object.values(hintsUsed).filter(Boolean).length;
      const score = calculateScore(newGuesses.length, hintCount);
      const streakReward = isDaily ? getStreakReward(gameState.streak + 1) : 0;
      const newState: GameState = {
        ...gameState,
        coins: gameState.coins + score + streakReward,
        totalCorrect: gameState.totalCorrect + 1,
        totalPlayed: gameState.totalPlayed + 1,
        streak: isDaily ? gameState.streak + 1 : gameState.streak,
        bestStreak: isDaily ? Math.max(gameState.bestStreak, gameState.streak + 1) : gameState.bestStreak,
        playedPlayerIds: [...gameState.playedPlayerIds, player.id],
      };
      saveGameState(newState);
      setGameState(newState);
      toast.success(`+${score} points! 🎉`);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      const newState: GameState = {
        ...gameState,
        totalPlayed: gameState.totalPlayed + 1,
        streak: 0,
        playedPlayerIds: [...gameState.playedPlayerIds, player.id],
      };
      saveGameState(newState);
      setGameState(newState);
      toast.error(`The answer was ${player.name}`);
    } else {
      toast.error("Wrong! Try again");
    }
  };

  const handleHint = (type: "letter" | "country" | "position" | "club") => {
    const cost = HINT_COSTS[type];
    if (gameState.coins < cost || hintsUsed[type]) return;

    setHintsUsed((prev) => ({ ...prev, [type]: true }));
    const newState = { ...gameState, coins: gameState.coins - cost };
    saveGameState(newState);
    setGameState(newState);
  };

  const handleShare = async () => {
    const text = generateShareText(puzzleNumber, guesses, won, player);
    try {
      await navigator.share?.({ text }) || navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  const handlePlayAgain = () => {
    if (isDaily) {
      navigate("/");
    } else {
      setGuesses([]);
      setWon(false);
      setGameOver(false);
      setHintsUsed({ letter: false, country: false, position: false, club: false });
      // Force re-render by navigating to same route
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom flex flex-col">
      {/* Top Bar */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="font-display font-bold text-sm text-foreground uppercase tracking-wider">
          {isDaily ? "Daily Challenge" : isHardcore ? "Hardcore" : "Unlimited"}
        </h2>
        <div className="flex items-center gap-1 text-accent">
          <span className="font-display font-bold text-sm">{gameState.coins}</span>
          <span>🪙</span>
        </div>
      </div>

      {/* Guess dots */}
      <div className="px-4 py-3">
        <GuessHistory guesses={guesses} correctName={player.name} maxGuesses={MAX_GUESSES} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        {/* Silhouette */}
        <div className="flex justify-center py-2">
          <Silhouette player={player} revealed={gameOver} />
        </div>

        {/* Club cards */}
        <div className="space-y-2">
          <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Club History</p>
          <div className="space-y-2">
            {visibleClubs.map((c, i) => (
              <ClubCard key={i} club={c.club} countryCode={c.countryCode} index={i} />
            ))}
          </div>
        </div>

        {/* Hints */}
        {!gameOver && !isHardcore && (
          <div className="space-y-2">
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Hints</p>
            <HintsPanel
              player={player}
              coins={gameState.coins}
              hintsUsed={hintsUsed}
              onUseHint={handleHint}
              revealedName={revealedName}
              disabled={gameOver}
            />
          </div>
        )}

        {/* Game over */}
        {gameOver && (
          <div className="rounded-2xl bg-card border border-border p-6 text-center space-y-4 animate-slide-up">
            {won ? (
              <>
                <p className="text-3xl">🎉</p>
                <p className="font-display font-bold text-xl text-foreground">
                  You got it in {guesses.length}!
                </p>
                {isDaily && gameState.streak > 0 && (
                  <p className="text-sm text-streak font-body">
                    🔥 {gameState.streak} day streak!
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-3xl">😔</p>
                <p className="font-display font-bold text-xl text-foreground">
                  It was {player.name}
                </p>
              </>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-display font-semibold text-sm text-primary-foreground"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={handlePlayAgain}
                className="rounded-xl bg-secondary border border-border px-5 py-3 font-display font-semibold text-sm text-foreground"
              >
                {isDaily ? "Home" : "Play Again"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      {!gameOver && (
        <div className="px-4 pb-6 pt-2 border-t border-border bg-background">
          <GuessInput onGuess={handleGuess} disabled={gameOver} />
        </div>
      )}
    </div>
  );
}

function getStreakReward(streak: number): number {
  if (streak >= 30) return 200;
  if (streak >= 14) return 100;
  if (streak >= 7) return 100;
  if (streak >= 3) return 50;
  return 0;
}
