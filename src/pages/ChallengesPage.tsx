import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Target, Calendar, Zap, Trophy, Gift, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  loadChallengeState,
  saveChallengeState,
  updateChallenges,
  getAvailableRewards,
  claimRewards,
  ChallengeState,
  DailyChallenge,
  WeeklyChallenge
} from "@/lib/challenges";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { hapticSuccess } from "@/lib/feedback";

export default function ChallengesPage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const [challengeState, setChallengeState] = useState<ChallengeState>(loadChallengeState);
  const [rewards, setRewards] = useState({ daily: 0, weekly: 0 });

  useEffect(() => {
    // Update challenges on load (resets if new day/week)
    const updated = updateChallenges(challengeState);
    setChallengeState(updated);
    saveChallengeState(updated);
    setRewards(getAvailableRewards(updated));
  }, []);

  const handleClaimRewards = () => {
    const { state: newState, totalReward } = claimRewards(challengeState);
    if (totalReward > 0) {
      setChallengeState(newState);
      saveChallengeState(newState);
      setRewards(getAvailableRewards(newState));
      
      // Update user coins
      if (profile) {
        updateProfile({ coins: (profile.coins || 0) + totalReward });
      }
      
      hapticSuccess();
      toast.success(`🎉 Claimed ${totalReward} XP bonus!`);
    }
  };

  const renderDailyChallenge = (challenge: DailyChallenge, index: number) => {
    const progress = challengeState.dailyProgress[challenge.type] || 0;
    const progressPercent = Math.min((progress / challenge.target) * 100, 100);
    
    return (
      <motion.div
        key={challenge.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`rounded-2xl border p-4 ${
          challenge.completed 
            ? "border-primary/30 bg-primary/5" 
            : "border-border bg-card"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            <h3 className="font-display font-bold text-sm text-foreground">
              {challenge.title}
            </h3>
            {challenge.completed && (
              <CheckCircle className="w-4 h-4 text-primary fill-current" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-accent" />
            <span className="text-xs font-display font-bold text-accent">
              +{challenge.reward}
            </span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mb-3">
          {challenge.description}
        </p>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-display font-bold text-foreground">
              {progress} / {challenge.target}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>
    );
  };

  const renderWeeklyChallenge = (challenge: WeeklyChallenge, index: number) => {
    const progress = challengeState.weeklyProgress[challenge.type] || 0;
    const progressPercent = Math.min((progress / challenge.target) * 100, 100);
    
    return (
      <motion.div
        key={challenge.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: (index + 3) * 0.1 }}
        className={`rounded-2xl border p-4 ${
          challenge.completed 
            ? "border-primary/30 bg-primary/5" 
            : "border-border bg-card"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <h3 className="font-display font-bold text-sm text-foreground">
              {challenge.title}
            </h3>
            {challenge.completed && (
              <CheckCircle className="w-4 h-4 text-primary fill-current" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-accent" />
            <span className="text-xs font-display font-bold text-accent">
              +{challenge.reward}
            </span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mb-3">
          {challenge.description}
        </p>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-display font-bold text-foreground">
              {progress} / {challenge.target}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full bg-purple-500 rounded-full"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>
    );
  };

  const totalRewards = rewards.daily + rewards.weekly;

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
            <h1 className="font-display font-black text-xl text-foreground">Daily & Weekly Challenges</h1>
            <p className="text-sm text-muted-foreground">Complete challenges to earn bonus XP</p>
          </div>
        </div>

        {/* Claim Rewards */}
        {totalRewards > 0 && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={handleClaimRewards}
            className="w-full rounded-2xl bg-gradient-to-r from-accent to-primary p-4 flex items-center justify-center gap-2 shadow-lg"
          >
            <Gift className="w-5 h-5 text-white" />
            <span className="font-display font-bold text-white">
              Claim {totalRewards} Bonus XP
            </span>
          </motion.button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Daily Challenges */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-accent" />
            <h2 className="font-display font-bold text-lg text-foreground">Daily Challenges</h2>
          </div>
          <div className="space-y-3">
            {challengeState.dailyChallenges.map(renderDailyChallenge)}
          </div>
        </div>

        {/* Weekly Challenges */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-500" />
            <h2 className="font-display font-bold text-lg text-foreground">Weekly Challenges</h2>
          </div>
          <div className="space-y-3">
            {challengeState.weeklyChallenges.map(renderWeeklyChallenge)}
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="px-4 py-3 border-t border-border bg-muted/30">
        <div className="flex items-center justify-center gap-2 text-center">
          <Trophy className="w-4 h-4 text-accent" />
          <p className="text-xs text-muted-foreground font-body">
            Challenges reset daily at midnight and weekly on Sunday
          </p>
        </div>
      </div>
    </motion.div>
  );
}