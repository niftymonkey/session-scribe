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
        <div className="space-y-3">
          {players.map((player, index) => (
            <div
              key={index}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                player.role === "dm"
                  ? "bg-accent/5 border-accent/25"
                  : "bg-card/50 border-border/40"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Role indicator */}
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-1",
                  player.role === "dm" ? "bg-accent/10" : "bg-secondary/40"
                )}>
                  {player.role === "dm" ? (
                    <Crown className="h-4 w-4 text-accent" />
                  ) : (
                    <Sword className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Editable fields */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Player Name
                      </Label>
                      <Input
                        value={player.playerName}
                        onChange={(e) =>
                          handleUpdatePlayer(index, { playerName: e.target.value })
                        }
                        placeholder="Real name"
                        className="h-8 inset-field text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        {player.role === "dm" ? "Display Name" : "Character Name"}
                      </Label>
                      <Input
                        value={player.characterName ?? ""}
                        onChange={(e) =>
                          handleUpdatePlayer(index, {
                            characterName: e.target.value || null,
                          })
                        }
                        placeholder={player.role === "dm" ? "Dungeon Master" : "Character name"}
                        className="h-8 inset-field text-sm"
                      />
                    </div>
                  </div>

                  {/* Role toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Role:</span>
                    <div className="flex gap-1">
                      <Button
                        variant={player.role === "player" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUpdatePlayer(index, { role: "player" })}
                        className="h-6 text-xs gap-1 px-2"
                      >
                        <Sword className="h-3 w-3" />
                        Player
                      </Button>
                      <Button
                        variant={player.role === "dm" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUpdatePlayer(index, { role: "dm" })}
                        className="h-6 text-xs gap-1 px-2"
                      >
                        <Crown className="h-3 w-3" />
                        DM
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePlayer(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
