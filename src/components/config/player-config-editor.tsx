import { useState } from "react";
import { Plus, Trash2, Crown, Sword } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PlayerConfig } from "@/types";

interface PlayerConfigEditorProps {
  players: PlayerConfig[];
  onPlayersChange: (players: PlayerConfig[]) => void;
  detectedSpeakers?: string[];
}

export function PlayerConfigEditor({
  players,
  onPlayersChange,
  detectedSpeakers = [],
}: PlayerConfigEditorProps) {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newCharacterName, setNewCharacterName] = useState("");
  const [newRole, setNewRole] = useState<"player" | "dm">("player");

  const handleAddPlayer = () => {
    if (!newCharacterName.trim()) return;

    const newPlayer: PlayerConfig = {
      playerName: newPlayerName.trim() || newCharacterName.trim(),
      characterName: newRole === "dm" ? "Dungeon Master" : newCharacterName.trim(),
      role: newRole,
    };

    onPlayersChange([...players, newPlayer]);
    setNewPlayerName("");
    setNewCharacterName("");
    setNewRole("player");
  };

  const handleRemovePlayer = (index: number) => {
    onPlayersChange(players.filter((_, i) => i !== index));
  };

  const handleUpdatePlayer = (index: number, updates: Partial<PlayerConfig>) => {
    onPlayersChange(
      players.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  };

  // Find speakers that aren't yet configured (check both playerName and characterName)
  const unmappedSpeakers = detectedSpeakers.filter(
    (speaker) =>
      speaker.trim().length > 0 &&
      !players.some(
        (p) =>
          p.playerName.toLowerCase() === speaker.toLowerCase() ||
          p.characterName?.toLowerCase() === speaker.toLowerCase()
      )
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Characters are auto-detected from transcripts. Set the DM and optionally add real player names.
      </p>

      {/* Existing players */}
      {players.length > 0 && (
        <div className="space-y-2">
          {players.map((player, index) => (
            <div
              key={index}
              className={cn(
                "group flex items-center gap-2 rounded-md border px-3 py-2 transition-all",
                player.role === "dm"
                  ? "bg-accent/5 border-accent/30"
                  : "bg-card/30 border-border/30 hover:border-border/50"
              )}
            >
              {/* Role toggle - clickable icon */}
              <button
                onClick={() =>
                  handleUpdatePlayer(index, {
                    role: player.role === "dm" ? "player" : "dm",
                  })
                }
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-md transition-all shrink-0",
                  player.role === "dm"
                    ? "bg-accent/15 text-accent hover:bg-accent/25"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
                title={
                  player.role === "dm"
                    ? "Dungeon Master (click to change)"
                    : "Player (click to change)"
                }
              >
                {player.role === "dm" ? (
                  <Crown className="h-3.5 w-3.5" />
                ) : (
                  <Sword className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Inputs - inline with placeholders as labels */}
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Input
                    value={player.playerName}
                    onChange={(e) =>
                      handleUpdatePlayer(index, { playerName: e.target.value })
                    }
                    placeholder="Player name"
                    className="h-7 flex-1 min-w-0 bg-transparent border-0 border-b border-border/30 rounded-none px-1 text-sm focus-visible:ring-0 focus-visible:border-accent/50 placeholder:text-muted-foreground/50"
                  />
                  <span className="text-muted-foreground/30 shrink-0">→</span>
                  <Input
                    value={player.characterName ?? ""}
                    onChange={(e) =>
                      handleUpdatePlayer(index, {
                        characterName: e.target.value || null,
                      })
                    }
                    placeholder={player.role === "dm" ? "Display name" : "Character"}
                    className="h-7 flex-1 min-w-0 bg-transparent border-0 border-b border-border/30 rounded-none px-1 text-sm focus-visible:ring-0 focus-visible:border-accent/50 placeholder:text-muted-foreground/50"
                  />
                </div>
                <Input
                  value={player.aliases?.join(", ") ?? ""}
                  onChange={(e) => {
                    const aliases = e.target.value
                      .split(",")
                      .map((a) => a.trim())
                      .filter((a) => a.length > 0);
                    handleUpdatePlayer(index, { aliases: aliases.length > 0 ? aliases : undefined });
                  }}
                  placeholder="Aliases (comma-separated, e.g., Mike, Mikael)"
                  className="h-6 bg-transparent border-0 border-b border-border/20 rounded-none px-1 text-xs text-muted-foreground focus-visible:ring-0 focus-visible:border-accent/50 placeholder:text-muted-foreground/40"
                />
              </div>

              {/* Delete - appears on hover */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemovePlayer(index)}
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Unmapped speakers suggestions */}
      {unmappedSpeakers.length > 0 && (
        <div className="space-y-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
          <Label className="text-xs text-muted-foreground">
            Characters not yet added:
          </Label>
          <div className="flex flex-wrap gap-2">
            {unmappedSpeakers.map((speaker) => (
              <Button
                key={speaker}
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewCharacterName(speaker);
                  setNewPlayerName("");
                }}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                {speaker}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Add new player form */}
      <div className="space-y-3 p-4 rounded-lg border border-border/40 bg-card/30">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">
              {newRole === "dm" ? "Name (from transcript)" : "Character Name (from transcript)"}
            </Label>
            <Input
              placeholder={newRole === "dm" ? "DM's name as it appears" : "Character name"}
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
              className="h-9 inset-field"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Player Name (optional)
            </Label>
            <Input
              placeholder="Real name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="h-9 inset-field"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={newRole === "player" ? "default" : "outline"}
              size="sm"
              onClick={() => setNewRole("player")}
              className="h-8 gap-1.5"
            >
              <Sword className="h-3.5 w-3.5" />
              Player
            </Button>
            <Button
              variant={newRole === "dm" ? "default" : "outline"}
              size="sm"
              onClick={() => setNewRole("dm")}
              className="h-8 gap-1.5"
            >
              <Crown className="h-3.5 w-3.5" />
              Dungeon Master
            </Button>
          </div>
          <Button
            size="sm"
            onClick={handleAddPlayer}
            disabled={!newCharacterName.trim()}
            className="h-8 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add to Party
          </Button>
        </div>
      </div>
    </div>
  );
}
