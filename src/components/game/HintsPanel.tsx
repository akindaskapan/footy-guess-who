import { HINT_COSTS } from "@/lib/gameState";
import { Player, countryCodeToFlag } from "@/data/players";
import { Eye, Globe, MapPin, Shield } from "lucide-react";

interface HintsPanelProps {
  player: Player;
  coins: number;
  hintsUsed: { letter: boolean; country: boolean; position: boolean; club: boolean };
  onUseHint: (type: "letter" | "country" | "position" | "club") => void;
  revealedName: string;
  disabled: boolean;
}

export function HintsPanel({ player, coins, hintsUsed, onUseHint, revealedName, disabled }: HintsPanelProps) {
  const hints = [
    {
      type: "letter" as const,
      icon: Eye,
      label: "Reveal Letters",
      cost: HINT_COSTS.letter,
      result: hintsUsed.letter ? revealedName : null,
    },
    {
      type: "country" as const,
      icon: Globe,
      label: "Nationality",
      cost: HINT_COSTS.country,
      result: hintsUsed.country ? `${countryCodeToFlag(player.countryCode)} ${player.country}` : null,
    },
    {
      type: "position" as const,
      icon: MapPin,
      label: "Position",
      cost: HINT_COSTS.position,
      result: hintsUsed.position ? player.position : null,
    },
    {
      type: "club" as const,
      icon: Shield,
      label: "Extra Club",
      cost: HINT_COSTS.club,
      result: hintsUsed.club ? player.careerClubs[player.careerClubs.length - 1] : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {hints.map((hint) => (
        <button
          key={hint.type}
          onClick={() => onUseHint(hint.type)}
          disabled={disabled || hintsUsed[hint.type] || coins < hint.cost}
          className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-3 transition-all hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {hint.result ? (
            <span className="text-sm font-body font-semibold text-accent">{hint.result}</span>
          ) : (
            <>
              <hint.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-body text-muted-foreground">{hint.label}</span>
              <span className="text-xs font-display font-bold text-accent">{hint.cost} 🪙</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}
