import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Calendar, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

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
            const score = tab === "alltime" ? entry.total_score : entry.weekly_score;
            const subtitle =
              tab === "alltime"
                ? `${entry.total_correct ?? 0} wins · ${entry.best_streak ?? 0}🔥`
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
                <span className="w-8 text-center font-display font-bold text-sm">
                  {getMedal(i)}
                </span>
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-bold text-foreground">
                  {(entry.display_name || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm text-foreground truncate">
                    {entry.display_name || "Anonymous"}
                    {isMe && <span className="text-primary ml-1">(you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">{subtitle}</p>
                </div>
                <span className="font-display font-bold text-accent text-sm">
                  {score ?? 0}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
