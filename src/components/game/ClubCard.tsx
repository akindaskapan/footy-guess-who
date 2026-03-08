import { countryCodeToFlag } from "@/data/players";

interface ClubCardProps {
  club: string;
  countryCode: string;
  revealed?: boolean;
  index: number;
}

export function ClubCard({ club, countryCode, revealed = true, index }: ClubCardProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 animate-slide-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <span className="text-xl">{countryCodeToFlag(countryCode)}</span>
      <span className="font-body text-sm font-medium text-card-foreground">
        {revealed ? club : "???"}
      </span>
    </div>
  );
}
