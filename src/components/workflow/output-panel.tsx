import { useState, useMemo } from "react";
import { UserPlus, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RecapDisplay } from "@/components/recap/recap-display";
import { RecapActions } from "@/components/recap/recap-actions";
import { cn } from "@/lib/utils";
import type { SessionRecap, DetectedNPC, NPCConfig } from "@/types";

interface OutputPanelProps {
  recap: SessionRecap;
  detectedNpcs: DetectedNPC[];
  savedNpcs: NPCConfig[];
  outputFilename: string;
  onSaveNpc: (npc: NPCConfig) => void;
  onRegenerate: () => void;
}

export function OutputPanel({
  recap,
  detectedNpcs,
  savedNpcs,
  outputFilename,
  onSaveNpc,
  onRegenerate,
}: OutputPanelProps) {
  const [savedNpcNames, setSavedNpcNames] = useState<Set<string>>(new Set());

  // Find NPCs that aren't already saved (memoized for performance)
  const newNpcs = useMemo(
    () =>
      detectedNpcs.filter((detected) => {
        const normalizedName = detected.canonicalName.toLowerCase().trim();
        return !savedNpcs.some(
          (saved) =>
            saved.name.toLowerCase().trim() === normalizedName ||
            saved.aliases.some((a) => a.toLowerCase().trim() === normalizedName)
        );
      }),
    [detectedNpcs, savedNpcs]
  );

  const handleSaveNpc = (npc: DetectedNPC) => {
    const npcConfig: NPCConfig = {
      name: npc.canonicalName,
      aliases: npc.variations.filter((v) => v !== npc.canonicalName),
    };
    onSaveNpc(npcConfig);
    setSavedNpcNames((prev) => new Set([...prev, npc.canonicalName]));
    toast.success(`Saved ${npc.canonicalName} to NPCs`);
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <RecapActions recap={recap} outputFilename={outputFilename} />
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          className="gap-2 hover:bg-secondary/50"
        >
          <RefreshCw className="h-4 w-4" />
          Regenerate
        </Button>
      </div>

      {/* New NPCs Detected */}
      {newNpcs.length > 0 && (
        <div className="surface-card rounded-xl p-4">
          <h3 className="text-sm font-medium text-foreground/80 mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary/70" />
            New NPCs Detected
          </h3>
          <p className="text-xs text-muted-foreground/70 mb-3">
            These NPCs were mentioned in this session. Save them for future sessions.
          </p>
          <div className="flex flex-wrap gap-2">
            {newNpcs.map((npc) => {
              const isSaved = savedNpcNames.has(npc.canonicalName);
              return (
                <button
                  key={npc.canonicalName}
                  type="button"
                  onClick={() => !isSaved && handleSaveNpc(npc)}
                  disabled={isSaved}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
                    isSaved
                      ? "bg-success/20 text-success/80 cursor-default"
                      : "bg-secondary/30 border border-border/30 text-muted-foreground/80 hover:border-primary/50 hover:text-foreground cursor-pointer"
                  )}
                >
                  {isSaved ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  {npc.canonicalName}
                  {npc.variations.length > 1 && !isSaved && (
                    <span className="text-muted-foreground/50 text-xs">
                      (+{npc.variations.length - 1})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recap Display */}
      <RecapDisplay recap={recap} />

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-border/30">
        <RecapActions recap={recap} outputFilename={outputFilename} />
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          className="gap-2 hover:bg-secondary/50"
        >
          <RefreshCw className="h-4 w-4" />
          Regenerate
        </Button>
      </div>
    </div>
  );
}
