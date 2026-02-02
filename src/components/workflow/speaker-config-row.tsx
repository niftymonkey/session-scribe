import { Crown, Sword, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MatchedBadge, type MatchType } from "./matched-badge";
import type { PlayerConfig } from "@/types";

interface SpeakerConfigRowProps {
  player: PlayerConfig;
  matchType: MatchType;
  matchedTo?: string;
  onChange: (updates: Partial<PlayerConfig>) => void;
  onRemove: () => void;
}

export function SpeakerConfigRow({
  player,
  matchType,
  matchedTo,
  onChange,
  onRemove,
}: SpeakerConfigRowProps) {
  const isDm = player.role === "dm";

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all",
        isDm
          ? "bg-accent/5 border-accent/30"
          : "bg-card/30 border-border/30 hover:border-border/50"
      )}
    >
      {/* Role toggle */}
      <button
        type="button"
        onClick={() => onChange({ role: isDm ? "player" : "dm" })}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg transition-all shrink-0",
          isDm
            ? "bg-accent/15 text-accent hover:bg-accent/25"
            : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        )}
        title={isDm ? "Dungeon Master (click to change)" : "Player (click to change)"}
      >
        {isDm ? <Crown className="h-4 w-4" /> : <Sword className="h-4 w-4" />}
      </button>

      {/* Speaker → Player → Character mapping */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {/* Speaker/Player name */}
        <Input
          value={player.playerName}
          onChange={(e) => onChange({ playerName: e.target.value })}
          placeholder="Speaker name"
          className="h-8 flex-1 min-w-0 bg-transparent border-0 border-b border-border/30 rounded-none px-1 text-sm focus-visible:ring-0 focus-visible:border-accent/50 placeholder:text-muted-foreground/50"
        />

        <span className="text-muted-foreground/40 shrink-0">as</span>

        {/* Character name */}
        <Input
          value={player.characterName ?? ""}
          onChange={(e) => onChange({ characterName: e.target.value || null })}
          placeholder={isDm ? "DM" : "Character"}
          className="h-8 flex-1 min-w-0 bg-transparent border-0 border-b border-border/30 rounded-none px-1 text-sm focus-visible:ring-0 focus-visible:border-accent/50 placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Matched badge */}
      <MatchedBadge matchType={matchType} matchedTo={matchedTo} />

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 group-focus-within:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
