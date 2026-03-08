import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, CheckCircle, Star } from "lucide-react";
import { players } from "@/data/players";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

// Generate a fixed level order from the dataset, sorted by difficulty
const CAMPAIGN_LEVELS = (() => {
  const easy = players.filter((p) => p.difficulty === "easy");
  const medium = players.filter((p) => p.difficulty === "medium");
  const hard = players.filter((p) => p.difficulty === "hard");
  return [...easy, ...medium, ...hard].map((p, i) => ({
    level: i + 1,
    playerId: p.id,
    playerName: p.name,
    difficulty: p.difficulty,
  }));
})();

function getLevelProgress(): { currentLevel: number; completedLevels: number[] } {
  try {
    const raw = localStorage.getItem("gtf_campaign_progress");
    if (!raw) return { currentLevel: 1, completedLevels: [] };
    return JSON.parse(raw);
  } catch {
    return { currentLevel: 1, completedLevels: [] };
  }
}

function saveLevelProgress(progress: { currentLevel: number; completedLevels: number[] }) {
  localStorage.setItem("gtf_campaign_progress", JSON.stringify(progress));
}

export { CAMPAIGN_LEVELS, getLevelProgress, saveLevelProgress };

const LEVELS_PER_PAGE = 30;

export default function CampaignScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [progress, setProgress] = useState(getLevelProgress);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(CAMPAIGN_LEVELS.length / LEVELS_PER_PAGE);
  const visibleLevels = CAMPAIGN_LEVELS.slice(
    page * LEVELS_PER_PAGE,
    (page + 1) * LEVELS_PER_PAGE
  );

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case "easy": return "text-primary";
      case "medium": return "text-accent";
      case "hard": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getDifficultyLabel = (d: string) => {
    switch (d) {
      case "easy": return "Easy";
      case "medium": return "Medium";
      case "hard": return "Hard";
      default: return d;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background safe-top safe-bottom"
    >
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-display font-bold text-lg text-foreground">Campaign</h2>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-accent" />
          <span className="font-display font-bold text-sm text-accent">
            Level {progress.currentLevel}
          </span>
        </div>
      </div>

      {/* Difficulty section header */}
      <div className="px-4 py-2">
        <p className="text-xs font-body text-muted-foreground">
          {progress.completedLevels.length}/{CAMPAIGN_LEVELS.length} completed
        </p>
      </div>

      {/* Level Grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-5 gap-2">
          {visibleLevels.map((lvl, i) => {
            const isCompleted = progress.completedLevels.includes(lvl.level);
            const isCurrent = lvl.level === progress.currentLevel;
            const isLocked = lvl.level > progress.currentLevel;

            return (
              <motion.button
                key={lvl.level}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.015 }}
                onClick={() => {
                  if (!isLocked) {
                    navigate(`/play/campaign?level=${lvl.level}`);
                  }
                }}
                disabled={isLocked}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-center transition-transform active:scale-95 ${
                  isCompleted
                    ? "bg-primary/20 border border-primary/30"
                    : isCurrent
                    ? "bg-accent/20 border-2 border-accent glow-gold"
                    : isLocked
                    ? "bg-secondary/50 border border-border opacity-50"
                    : "bg-card border border-border"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : isLocked ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <span className={`font-display font-bold text-sm ${isCurrent ? "text-accent" : "text-foreground"}`}>
                    {lvl.level}
                  </span>
                )}
                <span className={`text-[8px] font-body mt-0.5 ${getDifficultyColor(lvl.difficulty)}`}>
                  {getDifficultyLabel(lvl.difficulty)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 pb-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-display font-semibold text-foreground disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-muted-foreground font-body">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-display font-semibold text-foreground disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </motion.div>
  );
}
