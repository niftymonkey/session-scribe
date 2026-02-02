import { useState } from "react";
import { Plus, Trash2, User, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NPCConfig, DetectedNPC } from "@/types";

interface NPCConfigEditorProps {
  npcs: NPCConfig[];
  onNpcsChange: (npcs: NPCConfig[]) => void;
  detectedNPCs?: DetectedNPC[];
}

export function NPCConfigEditor({ npcs, onNpcsChange, detectedNPCs = [] }: NPCConfigEditorProps) {
  const [newName, setNewName] = useState("");
  const [newAliases, setNewAliases] = useState("");

  // Filter out NPCs that are already saved
  const unsavedNPCs = detectedNPCs.filter(
    (detected) => !npcs.some(
      (saved) => saved.name.toLowerCase() === detected.canonicalName.toLowerCase()
    )
  );

  const handleAddNpc = () => {
    if (!newName.trim()) return;

    const aliases = newAliases
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const newNpc: NPCConfig = {
      name: newName.trim(),
      aliases,
    };

    onNpcsChange([...npcs, newNpc]);
    setNewName("");
    setNewAliases("");
  };

  const handleRemoveNpc = (index: number) => {
    onNpcsChange(npcs.filter((_, i) => i !== index));
  };

  const handleUpdateNpc = (index: number, updates: Partial<NPCConfig>) => {
    onNpcsChange(npcs.map((n, i) => (i === index ? { ...n, ...updates } : n)));
  };

  const handleAliasesChange = (index: number, aliasesStr: string) => {
    const aliases = aliasesStr
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);
    handleUpdateNpc(index, { aliases });
  };

  const handleAddDetectedNPC = (detected: DetectedNPC) => {
    const newNpc: NPCConfig = {
      name: detected.canonicalName,
      aliases: detected.variations,
    };

    onNpcsChange([...npcs, newNpc]);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Define NPCs with aliases to normalize misheard names in transcripts.
      </p>

      {/* Existing NPCs */}
      {npcs.length > 0 && (
        <div className="space-y-2">
          {npcs.map((npc, index) => (
            <div
              key={index}
              className="group flex items-start gap-2 rounded-md border px-3 py-2 bg-card/30 border-border/30 hover:border-border/50 transition-all"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-secondary/40 text-muted-foreground shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1 space-y-1.5 min-w-0">
                <Input
                  value={npc.name}
                  onChange={(e) =>
                    handleUpdateNpc(index, { name: e.target.value })
                  }
                  placeholder="NPC name"
                  className="h-7 bg-transparent border-0 border-b border-border/30 rounded-none px-1 text-sm focus-visible:ring-0 focus-visible:border-accent/50 placeholder:text-muted-foreground/50"
                />
                <Input
                  value={npc.aliases.join(", ")}
                  onChange={(e) => handleAliasesChange(index, e.target.value)}
                  placeholder="Aliases (comma-separated)"
                  className="h-7 bg-transparent border-0 border-b border-border/30 rounded-none px-1 text-xs text-muted-foreground focus-visible:ring-0 focus-visible:border-accent/50 placeholder:text-muted-foreground/50"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveNpc(index)}
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 mt-0.5"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Detected from recap generation */}
      {unsavedNPCs.length > 0 && (
        <div className="space-y-3 p-4 rounded-lg border border-accent/30 bg-accent/5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <Label className="text-sm font-medium">Detected NPCs</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            These NPCs were identified during recap generation. Add them to normalize names in future sessions.
          </p>
          <div className="space-y-2">
            {unsavedNPCs.map((detected, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-md bg-card/50 border border-border/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {detected.canonicalName}
                  </div>
                  {detected.variations.length > 0 && (
                    <div className="text-xs text-muted-foreground break-words">
                      Also heard as: {detected.variations.join(", ")}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddDetectedNPC(detected)}
                  className="h-7 px-2 text-accent hover:text-accent hover:bg-accent/10"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new NPC form */}
      <div className="space-y-3 p-4 rounded-lg border border-border/40 bg-card/30">
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">
              NPC Name (canonical)
            </Label>
            <Input
              placeholder="Princess Priyanella"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-9 inset-field"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Aliases (comma-separated)
            </Label>
            <Input
              placeholder="Priyanella, Princess, Preanella, Pritenella"
              value={newAliases}
              onChange={(e) => setNewAliases(e.target.value)}
              className="h-9 inset-field"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleAddNpc}
            disabled={!newName.trim()}
            className="h-8 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add NPC
          </Button>
        </div>
      </div>
    </div>
  );
}
