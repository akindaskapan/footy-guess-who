import { useNavigate } from "react-router-dom";
import { Flame, Trophy, Coins, Zap, Clock, Skull } from "lucide-react";
import { loadGameState } from "@/lib/gameState";

export default function Home() {
  const navigate = useNavigate();
  const state = loadGameState();

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-accent" />
          <span className="font-display font-bold text-accent">{state.coins}</span>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-streak" />
          <span className="font-display font-bold text-streak">{state.streak}</span>
        </div>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <div className="text-center space-y-3">
          <h1 className="font-display text-4xl font-black tracking-tight text-foreground">
            Guess The
            <br />
            <span className="text-gold-gradient">Footballer</span>
          </h1>
          <p className="text-sm text-muted-foreground font-body">
            Can you identify the player from clues?
          </p>
        </div>

        {/* Menu */}
        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => navigate("/play/daily")}
            className="w-full flex items-center gap-4 rounded-2xl bg-primary p-4 glow-green transition-transform active:scale-[0.98]"
          >
            <Clock className="w-6 h-6 text-primary-foreground" />
            <div className="text-left">
              <p className="font-display font-bold text-primary-foreground">Daily Challenge</p>
              <p className="text-xs text-primary-foreground/70 font-body">New puzzle every day</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/play/unlimited")}
            className="w-full flex items-center gap-4 rounded-2xl bg-card border border-border p-4 transition-transform active:scale-[0.98]"
          >
            <Zap className="w-6 h-6 text-accent" />
            <div className="text-left">
              <p className="font-display font-bold text-foreground">Unlimited Mode</p>
              <p className="text-xs text-muted-foreground font-body">Play as many as you want</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/play/hardcore")}
            className="w-full flex items-center gap-4 rounded-2xl bg-card border border-border p-4 transition-transform active:scale-[0.98]"
          >
            <Skull className="w-6 h-6 text-destructive" />
            <div className="text-left">
              <p className="font-display font-bold text-foreground">Hardcore Mode</p>
              <p className="text-xs text-muted-foreground font-body">Less hints, more glory</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/stats")}
            className="w-full flex items-center gap-4 rounded-2xl bg-card border border-border p-4 transition-transform active:scale-[0.98]"
          >
            <Trophy className="w-6 h-6 text-accent" />
            <div className="text-left">
              <p className="font-display font-bold text-foreground">Stats & Profile</p>
              <p className="text-xs text-muted-foreground font-body">Track your progress</p>
            </div>
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[10px] text-muted-foreground/50 px-6 pb-6 font-body">
        This app is not affiliated with or endorsed by any football club, league, or player.
      </p>
    </div>
  );
}
