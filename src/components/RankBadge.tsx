import { getRank } from "@/lib/ranks";

interface RankBadgeProps {
  xp: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function RankBadge({ xp, size = "sm", showLabel = true }: RankBadgeProps) {
  const rank = getRank(xp);
  
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
  };
  
  return (
    <div className={`inline-flex items-center gap-1 rounded-full font-display font-bold ${rank.bg} ${rank.color} ${sizeClasses[size]}`}>
      <span>{rank.icon}</span>
      {showLabel && <span>{rank.label}</span>}
    </div>
  );
}