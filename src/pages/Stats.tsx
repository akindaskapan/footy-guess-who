import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Trophy, Target, Gamepad2, LogIn } from "lucide-react";
import { loadGameState } from "@/lib/gameState";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export default function Stats() {
  const navigate = useNavigate();
  const localState = loadGameState();
  const { user, profile } = useAuth();

  const totalPlayed = profile?.total_played ?? localState.totalPlayed;
  const totalCorrect = profile?.total_correct ?? localState.totalCorrect;
  const streak = profile?.streak ?? localState.streak;
  const bestStreak = profile?.best_streak ?? localState.bestStreak;
  const coins = profile?.coins ?? localState.coins;

  const winRate = totalPlayed > 0 ? Math.round((totalCorrect / totalPlayed) * 100) : 0;

  const stats = [
    { icon: Gamepad2, label: "Played", value: totalPlayed, color: "text-muted-foreground" },
    { icon: Target, label: "Win Rate", value: `${winRate}%`, color: "text-primary" },
    { icon: Flame, label: "Current Streak", value: streak, color: "text-streak" },
    { icon: Trophy, label: "Best Streak", value: bestStreak, color: "text-accent" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background safe-top safe-bottom"
    >
      <div className="px-4 pt-6 pb-2 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="font-display font-bold text-lg text-foreground">Stats & Profile</h2>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Sign in prompt */}
        {!user && (
          <button
            onClick={() => navigate("/auth")}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary/10 border border-primary/20 p-4"
          >
            <LogIn className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold text-sm text-primary">
              Sign in to save progress & compete
            </span>
          </button>
        )}

        {/* Profile card */}
        {user && profile && (
          <div className="rounded-2xl bg-card border border-border p-6 text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center text-2xl font-display font-bold text-primary">
              {(profile.display_name || "P")[0].toUpperCase()}
            </div>
            <p className="font-display font-bold text-lg text-foreground">{profile.display_name}</p>
            <p className="text-xs text-muted-foreground font-body">XP: {profile.total_score}</p>
          </div>
        )}

        {/* Coins */}
        <div className="rounded-2xl bg-card border border-border p-6 text-center">
          <p className="text-4xl mb-1">🪙</p>
          <p className="font-display text-3xl font-black text-accent">{coins}</p>
          <p className="text-xs text-muted-foreground font-body mt-1">Total Coins</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl bg-card border border-border p-4 text-center"
            >
              <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Streak rewards */}
        <div className="space-y-2">
          <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Streak Rewards</p>
          <div className="space-y-2">
            {[
              { days: 3, reward: "50 coins", achieved: bestStreak >= 3 },
              { days: 7, reward: "100 coins", achieved: bestStreak >= 7 },
              { days: 14, reward: "Rare reward", achieved: bestStreak >= 14 },
              { days: 30, reward: "Golden badge 🏅", achieved: bestStreak >= 30 },
            ].map((r) => (
              <div
                key={r.days}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  r.achieved ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                <span className="text-sm font-body text-foreground">{r.days} Day Streak</span>
                <span className={`text-sm font-display font-bold ${r.achieved ? "text-primary" : "text-muted-foreground"}`}>
                  {r.achieved ? "✓ " : ""}{r.reward}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
