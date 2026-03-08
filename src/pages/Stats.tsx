import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Trophy, Target, Gamepad2 } from "lucide-react";
import { loadGameState } from "@/lib/gameState";

export default function Stats() {
  const navigate = useNavigate();
  const state = loadGameState();
  const winRate = state.totalPlayed > 0
    ? Math.round((state.totalCorrect / state.totalPlayed) * 100)
    : 0;

  const stats = [
    { icon: Gamepad2, label: "Played", value: state.totalPlayed, color: "text-muted-foreground" },
    { icon: Target, label: "Win Rate", value: `${winRate}%`, color: "text-primary" },
    { icon: Flame, label: "Current Streak", value: state.streak, color: "text-streak" },
    { icon: Trophy, label: "Best Streak", value: state.bestStreak, color: "text-accent" },
  ];

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <div className="px-4 pt-6 pb-2 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="font-display font-bold text-lg text-foreground">Stats & Profile</h2>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Coins */}
        <div className="rounded-2xl bg-card border border-border p-6 text-center">
          <p className="text-4xl mb-1">🪙</p>
          <p className="font-display text-3xl font-black text-accent">{state.coins}</p>
          <p className="text-xs text-muted-foreground font-body mt-1">Total Coins</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-card border border-border p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Streak rewards */}
        <div className="space-y-2">
          <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Streak Rewards</p>
          <div className="space-y-2">
            {[
              { days: 3, reward: "50 coins", achieved: state.bestStreak >= 3 },
              { days: 7, reward: "100 coins", achieved: state.bestStreak >= 7 },
              { days: 14, reward: "Rare reward", achieved: state.bestStreak >= 14 },
              { days: 30, reward: "Golden badge 🏅", achieved: state.bestStreak >= 30 },
            ].map((r) => (
              <div
                key={r.days}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  r.achieved ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                <span className="text-sm font-body text-foreground">
                  {r.days} Day Streak
                </span>
                <span className={`text-sm font-display font-bold ${r.achieved ? "text-primary" : "text-muted-foreground"}`}>
                  {r.achieved ? "✓ " : ""}{r.reward}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
