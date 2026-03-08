import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Swords, Users } from "lucide-react";
import { Player, getDailyPlayer, getRandomPlayer, players } from "@/data/players";
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
import { ShareCard } from "@/components/game/ShareCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CAMPAIGN_LEVELS, getLevelProgress, saveLevelProgress } from "@/pages/CampaignScreen";

const MAX_GUESSES = 5;

export default function GameScreen() {
  const { mode } = useParams<{ mode: string }>();
  const [searchParams] = useSearchParams();
  const challengeCode = searchParams.get("challenge");
  const campaignLevel = searchParams.get("level");
  const navigate = useNavigate();
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const isDaily = mode === "daily";
  const isHardcore = mode === "hardcore";
  const isCampaign = mode === "campaign";
  const isChallenge = !!challengeCode;

  const [gameState, setGameState] = useState<GameState>(() => {
    const s = loadGameState();
    return isDaily ? resetDailyIfNeeded(s) : s;
  });

  const [guesses, setGuesses] = useState<string[]>(isDaily ? gameState.dailyGuesses : []);
  const [won, setWon] = useState(isDaily ? gameState.dailyWon : false);
  const [gameOver, setGameOver] = useState(isDaily ? gameState.dailyCompleted : false);
  const [hintsUsed, setHintsUsed] = useState(
    isDaily ? gameState.hintsUsed : { letter: false, country: false, position: false, club: false }
  );
  const [challengeData, setChallengeData] = useState<any>(null);

  // Load challenge data if applicable
  useEffect(() => {
    if (challengeCode) {
      supabase
        .from("challenges")
        .select("*")
        .eq("share_code", challengeCode)
        .single()
        .then(({ data }) => {
          if (data) setChallengeData(data);
        });
    }
  }, [challengeCode]);

  const player = useMemo<Player>(() => {
    if (isChallenge && challengeData) {
      return players.find((p) => p.id === challengeData.player_id) || getDailyPlayer();
    }
    if (isDaily) return getDailyPlayer();
    return getRandomPlayer(gameState.playedPlayerIds);
  }, [isDaily, isChallenge, challengeData]);

  const visibleClubs = useMemo(() => {
    const clubs = player.careerClubs.map((club, i) => ({
      club,
      countryCode: player.clubCountryCodes[i] || "XX",
    }));
    if (isHardcore) return clubs.slice(0, 2);
    return clubs.slice(0, 4);
  }, [player, isHardcore]);

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

  const saveResultToCloud = async (score: number, guessCount: number, didWin: boolean) => {
    if (!user) return;
    try {
      // Save game result
      await supabase.from("game_results").insert({
        user_id: user.id,
        player_id: player.id,
        mode: isChallenge ? "unlimited" : (mode || "unlimited"),
        guesses: guessCount,
        hints_used: Object.values(hintsUsed).filter(Boolean).length,
        score,
        won: didWin,
      });

      // Update profile stats
      if (profile) {
        const updates: any = {
          total_score: (profile.total_score || 0) + score,
          total_played: (profile.total_played || 0) + 1,
          coins: (profile.coins || 0) + score,
        };
        if (didWin) {
          updates.total_correct = (profile.total_correct || 0) + 1;
          if (isDaily) {
            updates.streak = (profile.streak || 0) + 1;
            updates.best_streak = Math.max(profile.best_streak || 0, updates.streak);
          }
        } else if (isDaily) {
          updates.streak = 0;
        }
        await updateProfile(updates);
      }

      // Update challenge if applicable
      if (isChallenge && challengeData) {
        const isCreator = user.id === challengeData.creator_id;
        if (isCreator) {
          await supabase
            .from("challenges")
            .update({ creator_guesses: guessCount, creator_score: score, creator_won: didWin })
            .eq("id", challengeData.id);
        } else {
          await supabase
            .from("challenges")
            .update({
              challenger_id: user.id,
              challenger_guesses: guessCount,
              challenger_score: score,
              challenger_won: didWin,
              status: "completed",
            })
            .eq("id", challengeData.id);
        }
      }
    } catch (err) {
      console.error("Failed to save result:", err);
    }
  };

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
      saveResultToCloud(score, newGuesses.length, true);
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
      saveResultToCloud(0, newGuesses.length, false);
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
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      toast.success("Copied to clipboard!");
    } catch {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  const handleChallengeFriend = async () => {
    if (!user) {
      toast.error("Sign in to challenge friends!");
      navigate("/auth");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("challenges")
        .insert({
          creator_id: user.id,
          player_id: player.id,
          creator_guesses: guesses.length,
          creator_score: won ? calculateScore(guesses.length, Object.values(hintsUsed).filter(Boolean).length) : 0,
          creator_won: won,
        })
        .select("share_code")
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/play/unlimited?challenge=${data.share_code}`;
      const text = `⚽ I challenge you! Can you guess this footballer?\n\n${url}`;

      if (navigator.share) {
        await navigator.share({ text, url });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Challenge link copied!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create challenge");
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
      window.location.reload();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background safe-top safe-bottom flex flex-col"
    >
      {/* Top Bar */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="font-display font-bold text-sm text-foreground uppercase tracking-wider">
          {isChallenge ? "Challenge" : isDaily ? "Daily Challenge" : isHardcore ? "Hardcore" : "Unlimited"}
        </h2>
        <div className="flex items-center gap-1 text-accent">
          <span className="font-display font-bold text-sm">
            {profile?.coins ?? gameState.coins}
          </span>
          <span>🪙</span>
        </div>
      </div>

      {/* Challenge banner */}
      {isChallenge && challengeData && challengeData.creator_won !== null && (
        <div className="mx-4 mb-2 rounded-xl bg-accent/10 border border-accent/20 p-3 text-center">
          <p className="text-xs text-accent font-body">
            <Swords className="inline w-3 h-3 mr-1" />
            Friend scored {challengeData.creator_score} in {challengeData.creator_guesses} guesses. Beat them!
          </p>
        </div>
      )}

      {/* Guess dots */}
      <div className="px-4 py-3">
        <GuessHistory guesses={guesses} correctName={player.name} maxGuesses={MAX_GUESSES} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        <div className="flex justify-center py-2">
          <Silhouette player={player} revealed={gameOver} />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Club History</p>
          <div className="space-y-2">
            {visibleClubs.map((c, i) => (
              <ClubCard key={i} club={c.club} countryCode={c.countryCode} index={i} />
            ))}
          </div>
        </div>

        {!gameOver && !isHardcore && (
          <div className="space-y-2">
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Hints</p>
            <HintsPanel
              player={player}
              coins={profile?.coins ?? gameState.coins}
              hintsUsed={hintsUsed}
              onUseHint={handleHint}
              revealedName={revealedName}
              disabled={gameOver}
            />
          </div>
        )}

        {/* Game over */}
        {gameOver && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="rounded-2xl bg-card border border-border p-6 text-center space-y-4"
          >
            {won ? (
              <>
                <p className="text-3xl">🎉</p>
                <p className="font-display font-bold text-xl text-foreground">
                  You got it in {guesses.length}!
                </p>
                {isDaily && (profile?.streak || gameState.streak) > 0 && (
                  <p className="text-sm text-streak font-body">
                    🔥 {profile?.streak || gameState.streak} day streak!
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

            {/* Challenge result */}
            {isChallenge && challengeData && gameOver && (
              <div className="rounded-xl bg-secondary p-3 space-y-1">
                <p className="text-xs text-muted-foreground font-body">Challenge Result</p>
                <p className="text-sm font-display font-bold text-foreground">
                  {won && challengeData.creator_won
                    ? guesses.length <= (challengeData.creator_guesses || 99)
                      ? "🏆 You won the challenge!"
                      : "Your friend wins this round"
                    : won
                    ? "🏆 You won!"
                    : "Better luck next time"}
                </p>
              </div>
            )}

            <ShareCard
              puzzleNumber={puzzleNumber}
              guesses={guesses}
              won={won}
              player={player}
              mode={isChallenge ? "challenge" : (mode || "unlimited")}
              hintsUsed={Object.values(hintsUsed).filter(Boolean).length}
            />

            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={handleChallengeFriend}
                className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-display font-semibold text-sm text-accent-foreground"
              >
                <Users className="w-4 h-4" />
                Challenge
              </button>
              <button
                onClick={handlePlayAgain}
                className="rounded-xl bg-secondary border border-border px-4 py-2.5 font-display font-semibold text-sm text-foreground"
              >
                {isDaily ? "Home" : "Play Again"}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      {!gameOver && (
        <div className="px-4 pb-6 pt-2 border-t border-border bg-background">
          <GuessInput onGuess={handleGuess} disabled={gameOver} />
        </div>
      )}
    </motion.div>
  );
}

function getStreakReward(streak: number): number {
  if (streak >= 30) return 200;
  if (streak >= 14) return 100;
  if (streak >= 7) return 100;
  if (streak >= 3) return 50;
  return 0;
}
