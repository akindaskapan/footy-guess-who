import { Player, countryCodeToFlag } from "@/data/players";
import { Share2, Copy } from "lucide-react";
import { toast } from "sonner";

interface ShareCardProps {
  puzzleNumber: number;
  guesses: string[];
  won: boolean;
  player: Player;
  mode: string;
  hintsUsed: number;
}

export function ShareCard({ puzzleNumber, guesses, won, player, mode, hintsUsed }: ShareCardProps) {
  const blocks = guesses.map((g, i) => {
    if (won && i === guesses.length - 1) return "🟩";
    return "⬛";
  });

  // Pad remaining with empty
  const remaining = 5 - guesses.length;
  for (let i = 0; i < remaining; i++) blocks.push("⬜");

  const clubFlags = player.clubCountryCodes
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 5)
    .map((c) => countryCodeToFlag(c))
    .join(" ");

  const modeLabel = mode === "daily" ? "Daily" : mode === "hardcore" ? "Hardcore" : "Unlimited";
  const scoreText = won ? `${guesses.length}/5` : "X/5";
  const hintText = hintsUsed === 0 ? "No hints! 🧠" : `${hintsUsed} hint${hintsUsed > 1 ? "s" : ""} used`;

  const shareText = `⚽ Guess The Footballer #${puzzleNumber} (${modeLabel})\n\n${blocks.join("")} ${scoreText}\n\nClubs: ${clubFlags}\n${hintText}\n\nPlay now → ${window.location.origin}`;

  const handleShare = async (platform?: string) => {
    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
      return;
    }
    if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Copied to clipboard!");
      }
    } catch {
      await navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="space-y-3">
      {/* Visual share card */}
      <div className="rounded-xl bg-secondary border border-border p-4 space-y-2 text-center">
        <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">
          Guess The Footballer #{puzzleNumber}
        </p>
        <div className="flex justify-center gap-1.5 py-1">
          {blocks.map((b, i) => (
            <span key={i} className="text-2xl leading-none">{b}</span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground font-body">{clubFlags}</p>
        <p className="text-xs font-display font-semibold text-foreground">{scoreText} · {hintText}</p>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleShare()}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 font-display font-semibold text-sm text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        <button
          onClick={() => handleShare("twitter")}
          className="rounded-xl bg-card border border-border px-3 py-2.5 font-display font-semibold text-sm text-foreground transition-transform active:scale-[0.98]"
          title="Share on X"
        >
          𝕏
        </button>
        <button
          onClick={() => handleShare("whatsapp")}
          className="rounded-xl bg-card border border-border px-3 py-2.5 font-display font-semibold text-sm text-foreground transition-transform active:scale-[0.98]"
          title="Share on WhatsApp"
        >
          💬
        </button>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(shareText);
            toast.success("Copied!");
          }}
          className="rounded-xl bg-card border border-border px-3 py-2.5 font-display font-semibold text-sm text-foreground transition-transform active:scale-[0.98]"
          title="Copy"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
