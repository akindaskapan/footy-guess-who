import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, X } from "lucide-react";
import { fireWinConfetti } from "@/lib/feedback";
import { RankInfo } from "@/lib/ranks";

interface RankUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newRank: RankInfo;
  oldRank: RankInfo;
}

export function RankUpModal({ isOpen, onClose, newRank, oldRank }: RankUpModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && !showConfetti) {
      // Delay confetti slightly for better visual impact
      const timer = setTimeout(() => {
        fireWinConfetti();
        setShowConfetti(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showConfetti]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="w-full max-w-sm bg-background rounded-2xl border border-border overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-accent/20 to-primary/20 p-6 text-center">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-background/20 hover:bg-background/30 transition-colors"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 10 }}
              className="w-16 h-16 mx-auto mb-3 bg-accent rounded-full flex items-center justify-center"
            >
              <Trophy className="w-8 h-8 text-accent-foreground" />
            </motion.div>

            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-display font-black text-2xl text-foreground"
            >
              RANK UP!
            </motion.h2>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Rank Progression */}
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-display font-bold ${oldRank.bg} ${oldRank.color}`}>
                  <span>{oldRank.icon}</span>
                  <span>{oldRank.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Previous</p>
              </div>

              <motion.div
                animate={{ x: [0, -5, 5, 0] }}
                transition={{ repeat: 3, duration: 0.8, delay: 0.5 }}
                className="flex items-center"
              >
                <Sparkles className="w-5 h-5 text-accent" />
                <div className="w-8 h-0.5 bg-accent mx-2" />
                <Sparkles className="w-5 h-5 text-accent" />
              </motion.div>

              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.8, 1.1, 1] }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-display font-bold ${newRank.bg} ${newRank.color}`}
                >
                  <span>{newRank.icon}</span>
                  <span>{newRank.label}</span>
                </motion.div>
                <p className="text-xs text-primary font-bold mt-1">NEW!</p>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h3 className="font-display font-bold text-sm text-foreground mb-2">
                🎯 New Benefits Unlocked
              </h3>
              <div className="space-y-1">
                {newRank.benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 + (index * 0.1) }}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Action */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={onClose}
              className="w-full rounded-xl bg-accent py-3 font-display font-bold text-sm text-accent-foreground shadow-lg hover:shadow-xl transition-shadow"
            >
              Continue Playing
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}