import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, Gem, Shield, Gift, Sparkles, Crown, Zap, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { loadGameState, saveGameState, getSkipUsesLeft, resetSkipUses, MAX_FREE_SKIPS, SKIP_PURCHASE_PRICE } from "@/lib/gameState";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { hapticSuccess } from "@/lib/feedback";
import { showRewardedAd, initializeAds } from "@/lib/adService";
import { useEffect, useState } from "react";

const DAILY_LOGIN_REWARDS = [40, 50, 60, 80, 100, 120, 200];

const COIN_ITEMS = [
  { id: "letter", label: "Reveal Letters", cost: 30, icon: "🔤", desc: "Shows partial name" },
  { id: "country", label: "Nationality", cost: 20, icon: "🌍", desc: "Shows player's country" },
  { id: "position", label: "Position", cost: 15, icon: "📍", desc: "Shows player role" },
  { id: "club", label: "Extra Club", cost: 40, icon: "🛡️", desc: "Shows another club" },
  { id: "extra_guess", label: "Extra Guess", cost: 50, icon: "🎯", desc: "+1 attempt in next game" },
];

const PREMIUM_ITEMS = [
  { id: "streak_shield", label: "Streak Shield", goldCost: 50, icon: Shield, desc: "Protect streak for 1 missed day", color: "text-primary" },
  { id: "rare_pack", label: "Rare Player Pack", goldCost: 80, icon: Gift, desc: "200 coins + 1 hint + 1 shield", color: "text-accent" },
];

const GOLD_PACKS = [
  { id: "pack_100", amount: 100, price: "₺29.99", label: "Starter", emoji: "💰", popular: false, bonus: 0 },
  { id: "pack_550", amount: 550, price: "₺99.99", label: "Popular", emoji: "💎", popular: true, bonus: 50 },
  { id: "pack_1200", amount: 1200, price: "₺179.99", label: "Best Value", emoji: "👑", popular: false, bonus: 200 },
  { id: "pack_3000", amount: 3000, price: "₺349.99", label: "VIP", emoji: "🏆", popular: false, bonus: 500 },
];

const AD_REWARD_GOLD = 15;

export default function Store() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const state = loadGameState();
  const coins = profile?.coins ?? state.coins;
  const [adCooldown, setAdCooldown] = useState(false);
  const [skipCount, setSkipCount] = useState(getSkipUsesLeft());

  useEffect(() => { initializeAds(); }, []);

  const addGold = async (amount: number) => {
    if (user && profile) {
      await updateProfile({ coins: (profile.coins || 0) + amount });
    } else {
      const newState = { ...state, coins: state.coins + amount };
      saveGameState(newState);
    }
  };

  const handleBuyPack = (pack: typeof GOLD_PACKS[0]) => {
    // In production, this would trigger a real IAP flow
    hapticSuccess();
    const total = pack.amount + pack.bonus;
    addGold(total);
    toast.success(`+${total} altın eklendi! ${pack.emoji}`);
  };

  const handleWatchAdForGold = async () => {
    if (adCooldown) return;
    const rewarded = await showRewardedAd();
    if (!rewarded) {
      toast.error("Reklam tamamlanamadı, tekrar deneyin.");
      return;
    }
    hapticSuccess();
    addGold(AD_REWARD_GOLD);
    toast.success(`+${AD_REWARD_GOLD} altın kazanıldı! 🎬`);
    setAdCooldown(true);
    setTimeout(() => setAdCooldown(false), 30000); // 30s cooldown
  };

  const today = new Date().toISOString().split("T")[0];
  const lastClaim = localStorage.getItem("gtf_last_daily_claim");
  const loginDay = parseInt(localStorage.getItem("gtf_login_day") || "0");
  const canClaimDaily = lastClaim !== today;
  const currentDayReward = DAILY_LOGIN_REWARDS[Math.min(loginDay, 6)];

  const claimDailyReward = async () => {
    if (!canClaimDaily) return;
    const reward = currentDayReward;
    const newDay = loginDay >= 6 ? 0 : loginDay + 1;

    localStorage.setItem("gtf_last_daily_claim", today);
    localStorage.setItem("gtf_login_day", String(newDay));

    if (user && profile) {
      await updateProfile({ coins: (profile.coins || 0) + reward });
    } else {
      const newState = { ...state, coins: state.coins + reward };
      saveGameState(newState);
    }

    toast.success(`+${reward} gold! 💎`);
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
          <h2 className="font-display font-bold text-lg text-foreground">Store</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="font-display font-bold text-sm text-accent">{coins}</span>
            <span>💎</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6 pb-8">
        {/* Daily Login Reward */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Daily Login Reward</p>
          </div>

          <motion.button
            onClick={claimDailyReward}
            disabled={!canClaimDaily}
            className={`w-full rounded-2xl border p-4 transition-transform active:scale-[0.98] ${
              canClaimDaily
                ? "bg-accent/10 border-accent/30 glow-gold"
                : "bg-card border-border opacity-60"
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="font-display font-bold text-foreground">
                  {canClaimDaily ? `Claim ${currentDayReward} gold!` : "Already claimed today"}
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Day {loginDay + 1} of 7 · Resets weekly
                </p>
              </div>
              <span className="text-3xl">{canClaimDaily ? "🎁" : "✅"}</span>
            </div>

            {/* Day progress */}
            <div className="flex gap-1 mt-3">
              {DAILY_LOGIN_REWARDS.map((reward, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-md py-1 text-center text-[10px] font-display font-bold ${
                    i < loginDay
                      ? "bg-primary/20 text-primary"
                      : i === loginDay && canClaimDaily
                      ? "bg-accent/20 text-accent animate-pulse-glow"
                      : i === loginDay
                      ? "bg-accent/20 text-accent"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {reward}
                </div>
              ))}
            </div>
          </motion.button>
        </div>

        {/* Gold Packs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Gem className="w-4 h-4 text-accent" />
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Altın Paketleri</p>
          </div>

          {/* Watch Ad for free gold */}
          <motion.button
            onClick={handleWatchAdForGold}
            disabled={adCooldown}
            className={`w-full rounded-xl border p-3 flex items-center gap-3 transition-transform active:scale-[0.98] ${
              adCooldown ? "bg-card border-border opacity-50" : "bg-primary/10 border-primary/30"
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left flex-1">
              <p className="font-display font-bold text-sm text-foreground">
                {adCooldown ? "Bekleniyor..." : "Reklam İzle"}
              </p>
              <p className="text-[10px] text-muted-foreground font-body">
                {adCooldown ? "30 saniye sonra tekrar dene" : "Ücretsiz altın kazan"}
              </p>
            </div>
            <span className="font-display font-bold text-sm text-primary">+{AD_REWARD_GOLD} 💎</span>
          </motion.button>

          <div className="grid grid-cols-2 gap-2">
            {GOLD_PACKS.map((pack, i) => (
              <motion.button
                key={pack.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => handleBuyPack(pack)}
                className={`relative rounded-xl border p-4 text-center space-y-1 transition-transform active:scale-[0.97] ${
                  pack.popular
                    ? "bg-accent/10 border-accent/40 glow-gold"
                    : "bg-card border-border"
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-display font-bold">
                    POPÜLER
                  </div>
                )}
                <span className="text-2xl">{pack.emoji}</span>
                <p className="font-display font-bold text-lg text-foreground">{pack.amount}</p>
                {pack.bonus > 0 && (
                  <p className="text-[10px] font-display font-bold text-primary">+{pack.bonus} BONUS</p>
                )}
                <p className="text-xs text-muted-foreground font-body">{pack.label}</p>
                <p className="font-display font-bold text-sm text-accent">{pack.price}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Hint Costs Reference */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-accent" />
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Hint Costs</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {COIN_ITEMS.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-3 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-display font-semibold text-xs text-foreground">{item.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-body">{item.desc}</p>
                <p className="font-display font-bold text-xs text-accent">{item.cost} 💎</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Coin Rewards */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Earn Coins</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            {[
              { label: "1st guess correct", reward: "+350 pts" },
              { label: "2nd guess correct", reward: "+200 pts" },
              { label: "3rd guess correct", reward: "+150 pts" },
              { label: "4th guess correct", reward: "+100 pts" },
              { label: "5th guess correct", reward: "+100 pts" },
              { label: "No hints bonus", reward: "+150 pts" },
              { label: "Daily streak (3 days)", reward: "+50 coins" },
              { label: "Daily streak (7 days)", reward: "+100 coins" },
              { label: "Daily streak (30 days)", reward: "+200 coins" },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-body text-muted-foreground">{r.label}</span>
                <span className="font-display font-bold text-primary">{r.reward}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skip / Show Answer Pack */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-accent" />
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Cevap Gösterme Hakkı</p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-sm text-foreground">Kalan Hak</p>
                <p className="text-xs text-muted-foreground font-body">Tahmin hakkın bitince cevabı görmek için kullanılır</p>
              </div>
              <div className="flex items-center gap-1">
                <span className={`font-display font-bold text-2xl ${skipCount > 0 ? "text-primary" : "text-destructive"}`}>
                  {skipCount}
                </span>
                <span className="text-xs text-muted-foreground">/ {MAX_FREE_SKIPS}</span>
              </div>
            </div>
            {skipCount === 0 && (
              <button
                onClick={() => {
                  hapticSuccess();
                  resetSkipUses();
                  setSkipCount(MAX_FREE_SKIPS);
                  toast.success(`${MAX_FREE_SKIPS} cevap gösterme hakkı satın alındı! ✅`);
                }}
                className="w-full p-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors text-center"
              >
                <p className="font-display font-bold text-sm text-foreground">{MAX_FREE_SKIPS} Hak Satın Al</p>
                <p className="text-xs font-bold text-primary">{SKIP_PURCHASE_PRICE}</p>
              </button>
            )}
          </motion.div>
        </div>

        {/* Premium Items */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Gem className="w-4 h-4 text-accent" />
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Premium Items</p>
          </div>
          <div className="space-y-2">
            {PREMIUM_ITEMS.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold text-sm text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{item.desc}</p>
                </div>
                <div className="text-center">
                  <p className="font-display font-bold text-sm text-accent">{item.goldCost}</p>
                  <p className="text-[10px] text-muted-foreground font-body">gold</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Subscription teaser */}
        <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-primary/10 p-5 text-center space-y-2">
          <Crown className="w-8 h-8 mx-auto text-accent" />
          <p className="font-display font-bold text-foreground">Premium Coming Soon</p>
          <p className="text-xs text-muted-foreground font-body">
            No ads · Unlimited hints · Daily 200 coins · Streak protection
          </p>
          <p className="font-display font-bold text-accent">$3.99/month</p>
        </div>
      </div>
    </motion.div>
  );
}
