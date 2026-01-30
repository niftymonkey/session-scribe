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
    if (!newPlayerName.trim()) return;

    const newPlayer: PlayerConfig = {
      playerName: newPlayerName.trim(),
      // DMs default to "Dungeon Master" as their character name if not specified
      characterName: newRole === "dm"
        ? (newCharacterName.trim() || "Dungeon Master")
        : (newCharacterName.trim() || null),
      role: newRole,
    };

    onPlayersChange([...players, newPlayer]);
    setNewPlayerName("");
    setNewCharacterName("");
    setNewRole("player");
  };

  const handleRemovePlayer = (playerName: string) => {
    onPlayersChange(players.filter((p) => p.playerName !== playerName));
  };

  const handleUpdatePlayer = (
    playerName: string,
    updates: Partial<PlayerConfig>
  ) => {
    onPlayersChange(
      players.map((p) =>
        p.playerName === playerName ? { ...p, ...updates } : p
      )
    );
  };

  // Find speakers that aren't yet configured
  const unmappedSpeakers = detectedSpeakers.filter(
    (speaker) =>
      !players.some(
        (p) => p.playerName.toLowerCase() === speaker.toLowerCase()
      )
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Map player names from transcripts to their character names.
      </p>

      {/* Existing players */}
      {players.length > 0 && (
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.playerName}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                player.role === "dm"
                  ? "bg-accent/5 border-accent/25"
                  : "bg-card/50 border-border/40"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg",
                player.role === "dm" ? "bg-accent/10" : "bg-secondary/40"
              )}>
                {player.role === "dm" ? (
                  <Crown className="h-4 w-4 text-accent" />
                ) : (
                  <Sword className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-sm font-medium">{player.playerName}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {player.role === "dm" ? "(Dungeon Master)" : "(Player)"}
                  </span>
                </div>
                <Input
                  placeholder={player.role === "dm" ? "Dungeon Master" : "Character name"}
                  value={player.characterName ?? ""}
                  onChange={(e) =>
                    handleUpdatePlayer(player.playerName, {
                      // For DMs, empty input defaults to "Dungeon Master"
                      characterName: player.role === "dm"
                        ? (e.target.value || "Dungeon Master")
                        : (e.target.value || null),
                    })
                  }
                  className="h-8 inset-field text-sm"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemovePlayer(player.playerName)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Unmapped speakers suggestions */}
      {unmappedSpeakers.length > 0 && (
        <div className="space-y-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
          <Label className="text-xs text-muted-foreground">
            Detected speakers not yet mapped:
          </Label>
          <div className="flex flex-wrap gap-2">
            {unmappedSpeakers.map((speaker) => (
              <Button
                key={speaker}
                variant="outline"
                size="sm"
                onClick={() => setNewPlayerName(speaker)}
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
            <Label className="text-xs text-muted-foreground">Player Name</Label>
            <Input
              placeholder="Real name (from transcript)"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="h-9 inset-field"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              {newRole === "dm" ? "Display Name" : "Character Name"}
            </Label>
            <Input
              placeholder={newRole === "dm" ? "Dungeon Master" : "Character name"}
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
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
            disabled={!newPlayerName.trim()}
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
