import { Link2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type MatchType = "exact" | "alias" | "none";

interface MatchedBadgeProps {
  matchType: MatchType;
  matchedTo?: string;
  className?: string;
}

export function MatchedBadge({ matchType, matchedTo, className }: MatchedBadgeProps) {
  if (matchType === "none") {
    return null;
  }

  const isExact = matchType === "exact";
  const Icon = isExact ? Check : Link2;
  const tooltipText = isExact
    ? `Exact match: ${matchedTo}`
    : `Matched via alias: ${matchedTo}`;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center",
        "w-5 h-5 rounded-full",
        "transition-all duration-200",
        isExact
          ? "bg-success/20 text-success"
          : "bg-primary/20 text-primary",
        className
      )}
      title={tooltipText}
    >
      <Icon className="w-3 h-3" />
    </div>
  );
}

/**
 * Determine match type for a speaker against saved config
 */
export function getMatchType(
  speakerName: string,
  savedPlayers: Array<{ playerName: string; aliases?: string[] }>
): { type: MatchType; matchedTo?: string } {
  const normalizedSpeaker = speakerName.toLowerCase().trim();

  for (const player of savedPlayers) {
    // Check exact match
    if (player.playerName.toLowerCase().trim() === normalizedSpeaker) {
      return { type: "exact", matchedTo: player.playerName };
    }

    // Check alias match
    if (player.aliases) {
      for (const alias of player.aliases) {
        if (alias.toLowerCase().trim() === normalizedSpeaker) {
          return { type: "alias", matchedTo: player.playerName };
        }
      }
    }
  }

  return { type: "none" };
}

/**
 * Determine match type for an NPC against saved config
 */
export function getNpcMatchType(
  npcName: string,
  savedNpcs: Array<{ name: string; aliases: string[] }>
): { type: MatchType; matchedTo?: string } {
  const normalizedName = npcName.toLowerCase().trim();

  for (const npc of savedNpcs) {
    // Check exact match
    if (npc.name.toLowerCase().trim() === normalizedName) {
      return { type: "exact", matchedTo: npc.name };
    }

    // Check alias match
    for (const alias of npc.aliases) {
      if (alias.toLowerCase().trim() === normalizedName) {
        return { type: "alias", matchedTo: npc.name };
      }
    }
  }

  return { type: "none" };
}
