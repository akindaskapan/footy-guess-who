import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, CheckCircle, Star, Play, Coins, Unlock, Eye } from "lucide-react";
import { players } from "@/data/players";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { hapticMedium, hapticSuccess } from "@/lib/feedback";
import { showRewardedAd, initializeAds } from "@/lib/adService";

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
const UNLOCK_COST = 50; // Gold to unlock one level
const UNLOCK_ALL_COST = 500; // Gold to unlock all levels

export default function CampaignScreen() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const [progress, setProgress] = useState(getLevelProgress);
  const [page, setPage] = useState(0);
  const [selectedLocked, setSelectedLocked] = useState<typeof CAMPAIGN_LEVELS[0] | null>(null);

  const totalPages = Math.ceil(CAMPAIGN_LEVELS.length / LEVELS_PER_PAGE);
  const visibleLevels = CAMPAIGN_LEVELS.slice(
    page * LEVELS_PER_PAGE,
    (page + 1) * LEVELS_PER_PAGE
  );

  const userGold = profile?.coins ?? 0;

  useEffect(() => { initializeAds(); }, []);

  const handleWatchAd = async () => {
    if (!selectedLocked) return;
    const rewarded = await showRewardedAd();
    if (!rewarded) {
      toast.error("Reklam tamamlanamadı, tekrar deneyin.");
      return;
    }
    hapticSuccess();
    toast.success("Reklam izlendi! Seviye açıldı 🎬");
    const newProgress = {
      ...progress,
      currentLevel: Math.max(progress.currentLevel, selectedLocked.level + 1),
      completedLevels: [...progress.completedLevels, selectedLocked.level],
    };
    setProgress(newProgress);
    saveLevelProgress(newProgress);
    setSelectedLocked(null);
    navigate(`/play/campaign?level=${selectedLocked.level}`);
  };

  const handlePayGold = () => {
    if (!selectedLocked) return;
    if (userGold < UNLOCK_COST) {
      toast.error(`Yeterli altın yok! ${UNLOCK_COST} altın gerekli.`);
      return;
    }
    hapticSuccess();
    updateProfile({ coins: userGold - UNLOCK_COST });
    const newProgress = {
      ...progress,
      currentLevel: Math.max(progress.currentLevel, selectedLocked.level + 1),
      completedLevels: [...progress.completedLevels, selectedLocked.level],
    };
    setProgress(newProgress);
    saveLevelProgress(newProgress);
    toast.success(`Seviye ${selectedLocked.level} açıldı! 🔓`);
    setSelectedLocked(null);
    navigate(`/play/campaign?level=${selectedLocked.level}`);
  };

  const handleUnlockAll = () => {
    if (userGold < UNLOCK_ALL_COST) {
      toast.error(`Yeterli altın yok! ${UNLOCK_ALL_COST} altın gerekli.`);
      return;
    }
    hapticSuccess();
    updateProfile({ coins: userGold - UNLOCK_ALL_COST });
    const allLevels = CAMPAIGN_LEVELS.map((l) => l.level);
    const newProgress = {
      currentLevel: CAMPAIGN_LEVELS.length,
      completedLevels: allLevels,
    };
    setProgress(newProgress);
    saveLevelProgress(newProgress);
    toast.success("Tüm seviyeler açıldı! 🏆");
    setSelectedLocked(null);
  };

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
      case "easy": return "Kolay";
      case "medium": return "Orta";
      case "hard": return "Zor";
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
          <h2 className="font-display font-bold text-lg text-foreground">Kampanya</h2>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-accent" />
          <span className="font-display font-bold text-sm text-accent">
            Seviye {progress.currentLevel}
          </span>
        </div>
      </div>

      <div className="px-4 py-2">
        <p className="text-xs font-body text-muted-foreground">
          {progress.completedLevels.length}/{CAMPAIGN_LEVELS.length} tamamlandı
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
                  if (isLocked) {
                    hapticMedium();
                    setSelectedLocked(lvl);
                  } else {
                    navigate(`/play/campaign?level=${lvl.level}`);
                  }
                }}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-center transition-transform active:scale-95 ${
                  isCompleted
                    ? "bg-primary/20 border border-primary/30"
                    : isCurrent
                    ? "bg-accent/20 border-2 border-accent glow-gold"
                    : isLocked
                    ? "bg-secondary/50 border border-border opacity-60"
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
            Önceki
          </button>
          <span className="text-xs text-muted-foreground font-body">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-display font-semibold text-foreground disabled:opacity-40"
          >
            Sonraki
          </button>
        </div>
      )}

      {/* Locked Level Dialog */}
      <Dialog open={!!selectedLocked} onOpenChange={(open) => !open && setSelectedLocked(null)}>
        <DialogContent className="max-w-xs rounded-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground text-center">
              🔒 Seviye {selectedLocked?.level}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-sm">
              Bu seviye kilitli. Açmak için bir yöntem seçin.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-2">
            {/* Watch Ad */}
            <button
              onClick={handleWatchAd}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="font-display font-bold text-sm text-foreground">Reklam İzle</p>
                <p className="text-xs text-muted-foreground">Reklam izleyerek seviyeyi aç</p>
              </div>
              <span className="text-xs font-bold text-primary">ÜCRETSİZ</span>
            </button>

            {/* Pay Gold */}
            <button
              onClick={handlePayGold}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left flex-1">
                <p className="font-display font-bold text-sm text-foreground">Altın ile Aç</p>
                <p className="text-xs text-muted-foreground">{UNLOCK_COST} altın harca</p>
              </div>
              <span className="text-xs font-bold text-accent">{UNLOCK_COST} 💎</span>
            </button>

            {/* Unlock All */}
            <button
              onClick={handleUnlockAll}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <Unlock className="w-5 h-5 text-destructive" />
              </div>
              <div className="text-left flex-1">
                <p className="font-display font-bold text-sm text-foreground">Tümünü Aç</p>
                <p className="text-xs text-muted-foreground">Tüm seviyeler açılır</p>
              </div>
              <span className="text-xs font-bold text-destructive">{UNLOCK_ALL_COST} 💎</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}