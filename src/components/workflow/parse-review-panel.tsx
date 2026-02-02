import { useState, useMemo, useCallback } from "react";
import {
  Calendar,
  Clock,
  FileText,
  FileOutput,
  Users,
  UserCheck,
  Plus,
  Sparkles,
  Key,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SpeakerConfigRow } from "./speaker-config-row";
import { getMatchType } from "./matched-badge";
import type { TranscriptData, PlayerConfig, NPCConfig } from "@/types";

type ReviewStep = "details" | "speakers" | "npcs" | "ready";

interface ParseReviewPanelProps {
  transcript: TranscriptData;
  players: PlayerConfig[];
  savedNpcs: NPCConfig[];
  savedPlayers: PlayerConfig[];
  hasApiKey: boolean;
  outputFilename: string;
  onOutputFilenameChange: (filename: string) => void;
  onPlayersChange: (players: PlayerConfig[]) => void;
  onGenerate: () => void;
}

export function ParseReviewPanel({
  transcript,
  players,
  savedNpcs,
  savedPlayers,
  hasApiKey,
  outputFilename,
  onOutputFilenameChange,
  onPlayersChange,
  onGenerate,
}: ParseReviewPanelProps) {
  // Determine available steps (skip NPCs if none)
  const hasNpcs = savedNpcs.length > 0;
  const allSteps: ReviewStep[] = hasNpcs
    ? ["details", "speakers", "npcs", "ready"]
    : ["details", "speakers", "ready"];

  const [currentStep, setCurrentStep] = useState<ReviewStep>("details");
  const [newPlayerName, setNewPlayerName] = useState("");

  const currentStepIndex = allSteps.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === allSteps.length - 1;

  const metadata = transcript.metadata;
  const entryCount = transcript.entries.length;
  const speakerCount = transcript.speakers.length;

  // Calculate readiness
  const hasDm = players.some((p) => p.role === "dm");
  const isReady = hasApiKey && hasDm;

  // Memoize match results for all players (avoids redundant O(n×m) calls in render)
  const playerMatches = useMemo(
    () => players.map((p) => getMatchType(p.playerName, savedPlayers)),
    [players, savedPlayers]
  );

  const matchedCount = useMemo(
    () => playerMatches.filter((m) => m.type !== "none").length,
    [playerMatches]
  );

  const handleUpdatePlayer = useCallback(
    (index: number, updates: Partial<PlayerConfig>) => {
      onPlayersChange(players.map((p, i) => (i === index ? { ...p, ...updates } : p)));
    },
    [players, onPlayersChange]
  );

  const handleRemovePlayer = useCallback(
    (index: number) => {
      onPlayersChange(players.filter((_, i) => i !== index));
    },
    [players, onPlayersChange]
  );

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return;
    const newPlayer: PlayerConfig = {
      playerName: newPlayerName.trim(),
      characterName: null,
      role: "player",
    };
    onPlayersChange([...players, newPlayer]);
    setNewPlayerName("");
  };

  // Format duration from seconds
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const goNext = () => {
    if (!isLastStep) {
      setCurrentStep(allSteps[currentStepIndex + 1]);
    }
  };

  const goBack = () => {
    if (!isFirstStep) {
      setCurrentStep(allSteps[currentStepIndex - 1]);
    }
  };

  const getStepLabel = (step: ReviewStep) => {
    switch (step) {
      case "details":
        return "Session Details";
      case "speakers":
        return "Speakers";
      case "npcs":
        return "NPCs";
      case "ready":
        return "Generate";
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {allSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = step === currentStep;
          return (
            <div key={step} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => index <= currentStepIndex && setCurrentStep(step)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all",
                  isCurrent && "bg-primary/20 text-primary",
                  isCompleted && "bg-success/10 text-success/80 cursor-pointer hover:bg-success/20",
                  !isCurrent && !isCompleted && "text-muted-foreground/50 cursor-default"
                )}
                disabled={index > currentStepIndex}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{getStepLabel(step)}</span>
              </button>
              {index < allSteps.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 rounded-full",
                    index < currentStepIndex ? "bg-success/30" : "bg-border/50"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {/* Step 1: Session Details */}
        {currentStep === "details" && (
          <div className="space-y-6 animate-fade-in">
            <div className="surface-card rounded-xl p-6">
              <h3 className="text-lg font-medium text-foreground mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary/70" />
                Session Details
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                {metadata.title && (
                  <div className="md:col-span-2">
                    <div className="text-xs text-muted-foreground/60 mb-1">Session Title</div>
                    <div className="text-lg font-medium">{metadata.title}</div>
                  </div>
                )}

                {metadata.date && (
                  <div>
                    <div className="text-xs text-muted-foreground/60 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Date
                    </div>
                    <div className="text-base font-medium">{formatDate(metadata.date)}</div>
                  </div>
                )}

                {metadata.durationSeconds > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground/60 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Duration
                    </div>
                    <div className="text-base font-medium">
                      {formatDuration(metadata.durationSeconds)}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs text-muted-foreground/60 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Transcript Entries
                  </div>
                  <div className="text-base font-medium">{entryCount.toLocaleString()}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground/60 mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Speakers Detected
                  </div>
                  <div className="text-base font-medium">{speakerCount}</div>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-border/30">
                  <label className="text-xs text-muted-foreground/60 mb-1.5 flex items-center gap-1">
                    <FileOutput className="w-3 h-3" />
                    Output Filename
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={outputFilename}
                      onChange={(e) => onOutputFilenameChange(e.target.value)}
                      placeholder="Session_Recap"
                      className="h-9 flex-1 inset-field text-sm"
                    />
                    <span className="text-sm text-muted-foreground/50">.docx</span>
                  </div>
                  <p className="text-xs text-muted-foreground/50 mt-1.5">
                    Used when exporting to Word document
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Speaker Configuration */}
        {currentStep === "speakers" && (
          <div className="space-y-6 animate-fade-in">
            <div className="surface-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary/70" />
                  Speaker Configuration
                </h3>
                {matchedCount > 0 && (
                  <span className="text-xs text-success/70 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    {matchedCount} matched from saved
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground/70 mb-6">
                Assign character names and identify the Dungeon Master. Click the role icon to
                toggle between player and DM.
              </p>

              <div className="space-y-2">
                {players.map((player, index) => {
                  const match = playerMatches[index];
                  return (
                    <SpeakerConfigRow
                      key={`${player.playerName}-${index}`}
                      index={index}
                      player={player}
                      matchType={match.type}
                      matchedTo={match.matchedTo}
                      onChange={handleUpdatePlayer}
                      onRemove={handleRemovePlayer}
                    />
                  );
                })}
              </div>

              {/* Add new speaker */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
                <Input
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
                  placeholder="Add a speaker manually..."
                  className="h-9 flex-1 inset-field text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddPlayer}
                  disabled={!newPlayerName.trim()}
                  className="h-9 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>

              {!hasDm && (
                <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-sm text-accent flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Please identify the Dungeon Master by clicking the sword icon to change it to
                    a crown.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Saved NPCs (only if there are NPCs) */}
        {currentStep === "npcs" && (
          <div className="space-y-6 animate-fade-in">
            <div className="surface-card rounded-xl p-6">
              <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary/70" />
                Saved NPCs
              </h3>

              <p className="text-xs text-muted-foreground/60 mb-4">
                These will be recognized in the recap.
              </p>

              <div className="flex flex-wrap gap-1.5">
                {savedNpcs.map((npc) => (
                  <span
                    key={npc.name}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-success/10 text-success/80"
                  >
                    <Check className="w-3 h-3" />
                    {npc.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Ready to Chronicle */}
        {currentStep === "ready" && (
          <div className="space-y-6 animate-fade-in">
            <div className="surface-card rounded-xl p-6 text-center">
              {isReady ? (
                <>
                  <Sparkles className="w-8 h-8 text-primary/70 mx-auto mb-4" />
                  <Button
                    onClick={onGenerate}
                    size="lg"
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Chronicle This Session
                  </Button>
                </>
              ) : (
                <>
                  <AlertCircle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-4" />
                  <div className="space-y-2 mb-4">
                    {!hasApiKey && (
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Key className="w-4 h-4" />
                        Configure your OpenAI API key in settings
                      </p>
                    )}
                    {!hasDm && (
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Users className="w-4 h-4" />
                        Go back to identify the Dungeon Master
                      </p>
                    )}
                  </div>
                  <Button disabled size="lg" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Chronicle This Session
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={isFirstStep}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {!isLastStep && (
          <Button onClick={goNext} className="gap-2">
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

