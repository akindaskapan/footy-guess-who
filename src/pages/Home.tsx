import { useNavigate } from "react-router-dom";
import { Flame, Trophy, Coins, Zap, Clock, Skull, Medal, Users, LogIn, LogOut, User, ShoppingBag, EyeOff, Timer, Map } from "lucide-react";
import { loadGameState } from "@/lib/gameState";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();
  const state = loadGameState();
  const { user, profile, signOut } = useAuth();

  const coins = profile?.coins ?? state.coins;
  const streak = profile?.streak ?? state.streak;

  const menuItems = [
    {
      label: "Daily Challenge",
      desc: "New puzzle every day",
      icon: Clock,
      path: "/play/daily",
      primary: true,
      iconColor: "text-primary-foreground",
    },
    {
      label: "Campaign",
      desc: "365 levels to conquer",
      icon: Map,
      path: "/campaign",
      iconColor: "text-primary",
    },
    {
      label: "Unlimited Mode",
      desc: "Play as many as you want",
      icon: Zap,
      path: "/play/unlimited",
      iconColor: "text-accent",
    },
    {
      label: "Time Attack",
      desc: "10 players, 90 seconds",
      icon: Timer,
      path: "/play/timeattack",
      iconColor: "text-accent",
    },
    {
      label: "Mystery Mode",
      desc: "No clubs, 2x rewards",
      icon: EyeOff,
      path: "/play/mystery",
      iconColor: "text-destructive",
    },
    {
      label: "Hardcore Mode",
      desc: "Less hints, more glory",
      icon: Skull,
      path: "/play/hardcore",
      iconColor: "text-destructive",
    },
    {
      label: "Leaderboard",
      desc: "Compete globally",
      icon: Medal,
      path: "/leaderboard",
      iconColor: "text-accent",
    },
    {
      label: "Stats & Profile",
      desc: "Track your progress",
      icon: Trophy,
      path: "/stats",
      iconColor: "text-accent",
    },
    {
      label: "Store",
      desc: "Rewards, hints & more",
      icon: ShoppingBag,
      path: "/store",
      iconColor: "text-accent",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background safe-top safe-bottom flex flex-col"
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">💎</span>
          <span className="font-display font-bold text-accent">{coins}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Flame className="w-5 h-5 text-streak" />
            <span className="font-display font-bold text-streak">{streak}</span>
          </div>
          {user ? (
            <button
              onClick={() => signOut()}
              className="p-1.5 rounded-lg hover:bg-secondary"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-display font-semibold"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* User badge */}
      {user && profile && (
        <div className="px-6 pb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
            <User className="w-3.5 h-3.5" />
            <span>{profile.display_name}</span>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="text-center space-y-3"
        >
          <h1 className="font-display text-4xl font-black tracking-tight text-foreground">
            Guess The
            <br />
            <span className="text-gold-gradient">Footballer</span>
          </h1>
          <p className="text-sm text-muted-foreground font-body">
            Can you identify the player from clues?
          </p>
        </motion.div>

        {/* Menu */}
        <div className="w-full max-w-xs space-y-3">
          {menuItems.map((item, i) => (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 rounded-2xl p-4 transition-transform active:scale-[0.98] ${
                item.primary
                  ? "bg-primary glow-green"
                  : "bg-card border border-border"
              }`}
            >
              <item.icon className={`w-6 h-6 ${item.primary ? "text-primary-foreground" : item.iconColor}`} />
              <div className="text-left">
                <p className={`font-display font-bold ${item.primary ? "text-primary-foreground" : "text-foreground"}`}>
                  {item.label}
                </p>
                <p className={`text-xs font-body ${item.primary ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {item.desc}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[10px] text-muted-foreground/50 px-6 pb-6 font-body">
        This app is not affiliated with or endorsed by any football club, league, or player.
      </p>
    </motion.div>
  );
}
