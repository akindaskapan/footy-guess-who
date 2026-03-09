import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Calendar, Crown, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { getRank, RANKS } from "@/lib/ranks";
import { RankBadge } from "@/components/RankBadge";

interface LeaderboardEntry {
  user_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  total_score?: number | null;
  total_correct?: number | null;
  total_played?: number | null;
  best_streak?: number | null;
  weekly_score?: number | null;
  weekly_wins?: number | null;
  weekly_games?: number | null;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"alltime" | "weekly">("alltime");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [tab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    if (tab === "alltime") {
      const { data } = await supabase
        .from("all_time_leaderboard")
        .select("*")
        .limit(50);
      setEntries((data as LeaderboardEntry[]) || []);
    } else {
      const { data } = await supabase
        .from("weekly_leaderboard")
        .select("*")
        .limit(50);
      setEntries((data as LeaderboardEntry[]) || []);
    }
    setLoading(false);
  };

  const getMedal = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `#${i + 1}`;
  };

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
        <h2 className="font-display font-bold text-lg text-foreground">Leaderboard</h2>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 flex gap-2">
        <button
          onClick={() => setTab("alltime")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-display font-semibold text-sm transition-all ${
            tab === "alltime"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          <Crown className="w-4 h-4" />
          All Time
        </button>
        <button
          onClick={() => setTab("weekly")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-display font-semibold text-sm transition-all ${
            tab === "weekly"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          <Calendar className="w-4 h-4" />
          This Week
        </button>
      </div>

      {/* Rank Legend */}
      <div className="px-4 pb-3">
        <div className="flex gap-1.5 flex-wrap">
          {RANKS.map((r) => (
            <span
              key={r.label}
              className={`text-[10px] font-display font-semibold px-2 py-0.5 rounded-full ${r.bg} ${r.color}`}
            >
              {r.label}
            </span>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 space-y-2 pb-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground font-body text-sm">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Trophy className="w-10 h-10 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground font-body text-sm">
              No scores yet. Be the first!
            </p>
          </div>
        ) : (
          entries.map((entry, i) => {
            const isMe = user?.id === entry.user_id;
            const xp = tab === "alltime" ? (entry.total_score ?? 0) : (entry.weekly_score ?? 0);
            const rank = getRank(tab === "alltime" ? xp : (entry.total_score ?? xp));
            const subtitle =
              tab === "alltime"
                ? `${entry.total_correct ?? 0} wins · ${entry.best_streak ?? 0}🔥 streak`
                : `${entry.weekly_wins ?? 0} wins · ${entry.weekly_games ?? 0} games`;

            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  isMe
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                }`}
              >
                {/* Position */}
                <span className="w-8 text-center font-display font-bold text-sm shrink-0">
                  {getMedal(i)}
                </span>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-display font-bold text-foreground shrink-0">
                  {(entry.display_name || "?")[0].toUpperCase()}
                </div>

                {/* Name + rank + subtitle */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-display font-semibold text-sm text-foreground truncate">
                      {entry.display_name || "Anonymous"}
                      {isMe && <span className="text-primary ml-1">(you)</span>}
                    </p>
                    <span className={`text-[10px] font-display font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${rank.bg} ${rank.color}`}>
                      {rank.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">{subtitle}</p>
                </div>

                {/* XP */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <Zap className="w-3.5 h-3.5 text-accent" />
                  <span className="font-display font-bold text-accent text-sm">
                    {xp.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-body ml-0.5">XP</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
