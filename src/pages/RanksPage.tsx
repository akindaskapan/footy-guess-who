import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Star, Target } from "lucide-react";
import { motion } from "framer-motion";
import { RANKS, getRank } from "@/lib/ranks";
import { useAuth } from "@/contexts/AuthContext";

export default function RanksPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const currentXP = profile?.total_score || 0;
  const currentRank = getRank(currentXP);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background safe-top safe-bottom flex flex-col"
    >
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate("/")} 
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="font-display font-black text-xl text-foreground">Rank System</h1>
            <p className="text-sm text-muted-foreground">Climb the ranks by earning XP</p>
          </div>
        </div>

        {/* Current Status */}
        {profile && (
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${currentRank.bg} flex items-center justify-center`}>
                  <span className="text-sm">{currentRank.icon}</span>
                </div>
                <div>
                  <p className="font-display font-bold text-sm text-foreground">
                    {profile.display_name}
                  </p>
                  <p className={`text-xs font-display font-semibold ${currentRank.color}`}>
                    {currentRank.label}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-lg text-foreground">{currentXP}</p>
                <p className="text-xs text-muted-foreground">Total XP</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ranks List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {RANKS.map((rank, index) => {
          const isCurrentRank = currentRank.minXP === rank.minXP;
          const isAchieved = currentXP >= rank.minXP;
          const isNext = !isAchieved && (index === 0 || currentXP >= RANKS[index - 1].minXP);

          return (
            <motion.div
              key={rank.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl border p-4 transition-all ${
                isCurrentRank
                  ? "border-primary bg-primary/5 shadow-md"
                  : isAchieved
                  ? "border-green-200 bg-green-50/50"
                  : isNext
                  ? "border-accent/30 bg-accent/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${
                  isAchieved ? rank.bg : "bg-secondary"
                }`}>
                  {isAchieved ? rank.icon : "🔒"}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-display font-bold text-sm ${
                      isAchieved ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {rank.label}
                    </h3>
                    {isCurrentRank && (
                      <div className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-display font-bold">
                        CURRENT
                      </div>
                    )}
                    {isAchieved && !isCurrentRank && (
                      <Star className="w-4 h-4 text-green-600 fill-current" />
                    )}
                    {isNext && !isAchieved && (
                      <Target className="w-4 h-4 text-accent" />
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">
                    Requires: <span className="font-display font-bold">{rank.minXP.toLocaleString()} XP</span>
                    {!isAchieved && currentXP > 0 && (
                      <span className="ml-2 text-accent font-display font-semibold">
                        ({(rank.minXP - currentXP).toLocaleString()} needed)
                      </span>
                    )}
                  </p>

                  {/* Benefits */}
                  <div className="space-y-1">
                    {rank.benefits.map((benefit, benefitIndex) => (
                      <div
                        key={benefitIndex}
                        className={`flex items-center gap-2 text-xs ${
                          isAchieved ? "text-muted-foreground" : "text-muted-foreground/60"
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          isAchieved ? "bg-primary" : "bg-muted-foreground/30"
                        }`} />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Info */}
      <div className="px-4 py-3 border-t border-border bg-muted/30">
        <div className="flex items-center justify-center gap-2 text-center">
          <Trophy className="w-4 h-4 text-accent" />
          <p className="text-xs text-muted-foreground font-body">
            Keep playing to earn XP and unlock higher ranks!
          </p>
        </div>
      </div>
    </motion.div>
  );
}