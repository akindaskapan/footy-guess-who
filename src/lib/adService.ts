/**
 * AdMob Rewarded Ad Service
 * Uses @capacitor-community/admob on native, falls back to a simulated ad on web.
 */

import { Capacitor } from "@capacitor/core";

// Test ad unit IDs from Google (safe for development)
const REWARDED_AD_UNIT = {
  android: "ca-app-pub-3940256099942544/5224354917",
  ios: "ca-app-pub-3940256099942544/1712485313",
};

let admobInitialized = false;

async function getAdMob() {
  // Dynamic import so web builds don't crash
  const { AdMob } = await import("@capacitor-community/admob");
  return AdMob;
}

export async function initializeAds(): Promise<void> {
  if (admobInitialized) return;

  if (Capacitor.isNativePlatform()) {
    try {
      const AdMob = await getAdMob();
      await AdMob.initialize({
        initializeForTesting: true, // Switch to false for production
      });
      admobInitialized = true;
      console.log("[AdMob] Initialized successfully");
    } catch (e) {
      console.warn("[AdMob] Init failed, falling back to simulation:", e);
    }
  }
}

/**
 * Shows a rewarded ad.
 * Returns true if the user earned the reward, false otherwise.
 */
export async function showRewardedAd(): Promise<boolean> {
  // Native path — real AdMob
  if (Capacitor.isNativePlatform() && admobInitialized) {
    try {
      const AdMob = await getAdMob();
      const { RewardAdPluginEvents } = await import("@capacitor-community/admob");

      const platform = Capacitor.getPlatform() as "android" | "ios";
      const adId = REWARDED_AD_UNIT[platform] ?? REWARDED_AD_UNIT.android;

      // Prepare the ad
      await AdMob.prepareRewardVideoAd({ adId });

      // Wait for reward or dismissal
      return new Promise<boolean>((resolve) => {
        let rewarded = false;

        const rewardListener = AdMob.addListener(
          RewardAdPluginEvents.Rewarded,
          () => {
            rewarded = true;
          }
        );

        const dismissListener = AdMob.addListener(
          RewardAdPluginEvents.Dismissed,
          () => {
            rewardListener.remove();
            dismissListener.remove();
            resolve(rewarded);
          }
        );

        const failListener = AdMob.addListener(
          RewardAdPluginEvents.FailedToLoad,
          () => {
            rewardListener.remove();
            dismissListener.remove();
            failListener.remove();
            resolve(false);
          }
        );

        AdMob.showRewardVideoAd();
      });
    } catch (e) {
      console.warn("[AdMob] Rewarded ad error:", e);
      return showSimulatedRewardedAd();
    }
  }

  // Web fallback — simulated full-screen ad
  return showSimulatedRewardedAd();
}

/**
 * Shows a simulated rewarded ad overlay for web preview / testing.
 */
function showSimulatedRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "sim-ad-overlay";
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.95);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: system-ui, sans-serif;
    `;

    let seconds = 5;

    overlay.innerHTML = `
      <div style="text-align:center; color:white;">
        <div style="font-size:12px; opacity:0.6; margin-bottom:16px; letter-spacing:2px;">REKLAM</div>
        <div style="width:280px; height:200px; border-radius:16px; background:linear-gradient(135deg,#1a6b3c,#2eb872); display:flex; align-items:center; justify-content:center; margin-bottom:24px;">
          <div style="font-size:48px;">⚽</div>
        </div>
        <p style="font-size:14px; opacity:0.8; margin-bottom:8px;">Ödülünüzü almak için bekleyin</p>
        <div id="sim-ad-timer" style="font-size:32px; font-weight:bold; color:#e6a817;">${seconds}</div>
        <button id="sim-ad-close" style="display:none; margin-top:20px; padding:12px 32px; border-radius:12px; background:#2eb872; color:white; border:none; font-size:16px; font-weight:bold; cursor:pointer;">
          ✓ Ödülü Al
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    const timer = setInterval(() => {
      seconds--;
      const timerEl = document.getElementById("sim-ad-timer");
      const closeBtn = document.getElementById("sim-ad-close");
      if (timerEl) timerEl.textContent = String(seconds);

      if (seconds <= 0) {
        clearInterval(timer);
        if (timerEl) timerEl.textContent = "✓";
        if (closeBtn) closeBtn.style.display = "inline-block";
      }
    }, 1000);

    // Close button handler
    const handleClose = () => {
      overlay.remove();
      resolve(true);
    };

    // Use event delegation since button is created dynamically
    overlay.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).id === "sim-ad-close") {
        handleClose();
      }
    });
  });
}

/**
 * Shows an interstitial ad (every N levels).
 */
export async function showInterstitialAd(): Promise<void> {
  if (Capacitor.isNativePlatform() && admobInitialized) {
    try {
      const AdMob = await getAdMob();
      const platform = Capacitor.getPlatform() as "android" | "ios";
      const adId = platform === "ios"
        ? "ca-app-pub-3940256099942544/4411468910"
        : "ca-app-pub-3940256099942544/1033173712";

      await AdMob.prepareInterstitial({ adId });
      await AdMob.showInterstitial();
    } catch (e) {
      console.warn("[AdMob] Interstitial error:", e);
    }
  }
  // No web fallback for interstitials — skip silently
}
