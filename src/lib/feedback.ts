/**
 * Utility for confetti and haptic feedback
 */
import confetti from "canvas-confetti";

export function fireWinConfetti() {
  // First burst
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#2eb872", "#e6a817", "#ffffff", "#1a6b3c"],
  });

  // Second burst with delay
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#2eb872", "#e6a817"],
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#2eb872", "#e6a817"],
    });
  }, 200);
}

export function hapticLight() {
  if (navigator.vibrate) navigator.vibrate(10);
}

export function hapticMedium() {
  if (navigator.vibrate) navigator.vibrate(25);
}

export function hapticHeavy() {
  if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
}

export function hapticSuccess() {
  if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
}

export function hapticError() {
  if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
}
