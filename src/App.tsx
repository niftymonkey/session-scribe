import { useEffect, useState, useCallback, useRef } from "react";
import { Scroll, ArrowRight } from "lucide-react";
import { ImportPanel } from "@/components/import/import-panel";
import { SettingsDialog } from "@/components/config/settings-dialog";
import { Button } from "@/components/ui/button";
import { ZoomControl } from "@/components/ui/zoom-control";
import {
  PhaseContainer,
  ImportPhaseSummaryDisplay,
  ParseReviewSummaryDisplay,
  GeneratePhaseSummaryDisplay,
  ParseReviewPanel,
  GenerationProgress,
  OutputPanel,
} from "@/components/workflow";
import { useFileImport } from "@/hooks/use-file-import";
import { useConfig } from "@/hooks/use-config";
import { useSummarizer } from "@/hooks/use-summarizer";
import { useZoom } from "@/hooks/use-zoom";
import type {
  Phase,
  PhaseStatus,
  PhaseState,
  ImportPhaseSummary,
  ParseReviewSummary,
  GeneratePhaseSummary,
  PlayerConfig,
  NPCConfig,
} from "@/types";

export default function App() {
  const {
    transcript,
    diceLog,
    transcriptState,
    diceLogState,
    transcriptError,
    diceLogError,
    importTranscript,
    importDiceLog,
    clearTranscript,
    clearDiceLog,
  } = useFileImport();

  const { config, isLoading, hasApiKey, updateAll } = useConfig();

  const {
    state: summarizerState,
    recap,
    detectedNPCs,
    progress,
    error: summarizerError,
    generate,
    reset: resetSummarizer,
    isGenerating,
  } = useSummarizer();

  // Enable zoom with Ctrl+/- and Ctrl+scroll
  const { zoom, zoomIn, zoomOut, resetZoom, canZoomIn, canZoomOut } = useZoom();

  // Phase state management
  const [phaseState, setPhaseState] = useState<PhaseState>({
    current: "import",
    completed: [],
    expanded: ["import"],
  });

  // Track explicit user continuation from import phase
  const [hasConfirmedImport, setHasConfirmedImport] = useState(false);

  // Track generation start time for elapsed timer
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [generationElapsedTime, setGenerationElapsedTime] = useState<string | null>(null);

  // Output filename (user-configurable)
  const [outputFilename, setOutputFilename] = useState<string>("");

  // Ref for scroll behavior
  const shouldScrollToPhase = useRef<Phase | null>(null);

  // Get all detected speakers from transcript
  const detectedSpeakers = transcript?.speakers ?? [];

  // Auto-populate players from detected speakers (which are character names)
  useEffect(() => {
    if (!transcript || isLoading) return;

    const validSpeakers = transcript.speakers.filter((s) => s.trim().length > 0);

    // Check against both playerName and characterName to find existing entries
    const existingNames = new Set(
      config.players
        .flatMap((p) => [p.playerName.toLowerCase(), p.characterName?.toLowerCase()])
        .filter((n): n is string => n !== null && n !== undefined)
    );

    // Find speakers not already configured
    const newSpeakers = validSpeakers.filter(
      (speaker) => !existingNames.has(speaker.toLowerCase())
    );

    // Also fix any existing entries that have null characterName
    const fixedPlayers = config.players.map((p) => ({
      ...p,
      characterName: p.characterName ?? p.playerName,
    }));

    const hasFixedPlayers = config.players.some((p) => p.characterName === null);

    if (newSpeakers.length > 0 || hasFixedPlayers) {
      const newPlayers: PlayerConfig[] = newSpeakers.map((speaker) => ({
        playerName: speaker,
        characterName: speaker,
        role: "player" as const,
      }));

      updateAll({ players: [...fixedPlayers, ...newPlayers] });
    }
  }, [transcript, isLoading]); // Only run when transcript changes, not on every config update

  // Initialize output filename from session title
  useEffect(() => {
    if (transcript?.metadata.title && !outputFilename) {
      const sanitized = transcript.metadata.title.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
      setOutputFilename(sanitized ? `${sanitized}_Recap` : "Session_Recap");
    }
  }, [transcript?.metadata.title]);

  // Derive phase statuses from hook states
  const getPhaseStatus = useCallback(
    (phase: Phase): PhaseStatus => {
      switch (phase) {
        case "import":
          if (hasConfirmedImport && transcriptState === "success") return "complete";
          if (transcriptState === "success") return "active"; // Ready but not confirmed
          return "active";

        case "parse-review":
          if (!hasConfirmedImport || transcriptState !== "success") return "locked";
          if (summarizerState === "generating" || summarizerState === "success")
            return "complete";
          return phaseState.current === "parse-review" ? "active" : "available";

        case "generate":
          if (!hasApiKey || !hasConfirmedImport || transcriptState !== "success") return "locked";
          if (summarizerState === "generating") return "active";
          if (summarizerState === "success") return "complete";
          return "available";

        case "output":
          if (summarizerState !== "success") return "locked";
          return "active";
      }
    },
    [transcriptState, summarizerState, hasApiKey, phaseState.current, hasConfirmedImport]
  );

  // Update phase state based on hook states
  useEffect(() => {
    let newCurrent: Phase = "import";
    const newCompleted: Phase[] = [];

    // Only move past import if user has confirmed
    if (hasConfirmedImport && transcriptState === "success") {
      newCompleted.push("import");
      newCurrent = "parse-review";
    }

    if (summarizerState === "generating") {
      newCompleted.push("parse-review");
      newCurrent = "generate";
    }

    if (summarizerState === "success") {
      newCompleted.push("parse-review", "generate");
      newCurrent = "output";
    }

    setPhaseState((prev) => {
      // Determine which phases should be expanded
      let newExpanded = [...prev.expanded];

      // If we're moving to a new phase, expand it and collapse old active
      if (prev.current !== newCurrent) {
        // Collapse the previous active phase if it's now complete
        if (newCompleted.includes(prev.current) && newCurrent !== "output") {
          newExpanded = newExpanded.filter((p) => p !== prev.current);
        }
        // Expand the new current phase
        if (!newExpanded.includes(newCurrent)) {
          newExpanded.push(newCurrent);
        }
        // Trigger scroll
        shouldScrollToPhase.current = newCurrent;
      }

      return {
        current: newCurrent,
        completed: [...new Set(newCompleted)],
        expanded: newExpanded,
      };
    });
  }, [transcriptState, summarizerState, hasConfirmedImport]);

  // Track generation timing
  useEffect(() => {
    if (summarizerState === "generating" && !generationStartTime) {
      setGenerationStartTime(Date.now());
    } else if (summarizerState === "success" && generationStartTime) {
      const elapsed = Math.floor((Date.now() - generationStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      setGenerationElapsedTime(`${mins}m ${secs}s`);
      setGenerationStartTime(null);
    } else if (summarizerState === "idle") {
      setGenerationStartTime(null);
      setGenerationElapsedTime(null);
    }
  }, [summarizerState, generationStartTime]);

  const toggleExpand = (phase: Phase) => {
    setPhaseState((prev) => ({
      ...prev,
      expanded: prev.expanded.includes(phase)
        ? prev.expanded.filter((p) => p !== phase)
        : [...prev.expanded, phase],
    }));
  };

  // Handle explicit continue from import phase
  const handleContinueFromImport = () => {
    setHasConfirmedImport(true);
  };

  // Reset confirmation when transcript is cleared
  const handleClearTranscript = () => {
    clearTranscript();
    setHasConfirmedImport(false);
  };

  const handleGenerate = () => {
    if (!transcript || !config.openaiApiKey) return;

    const bookAct =
      config.campaign.currentBook || config.campaign.currentAct
        ? `Book ${config.campaign.currentBook ?? "?"}, Act ${config.campaign.currentAct ?? "?"}`
        : undefined;

    generate(
      config.openaiApiKey,
      transcript,
      config.players,
      config.npcs,
      config.campaign.name || undefined,
      bookAct,
      config.selectedModel
    );
  };

  const handleRegenerate = () => {
    resetSummarizer();
    // Small delay to let state reset, then regenerate
    setTimeout(handleGenerate, 100);
  };

  const handlePlayersChange = (players: PlayerConfig[]) => {
    updateAll({ players });
  };

  const handleSaveNpc = (npc: NPCConfig) => {
    updateAll({ npcs: [...config.npcs, npc] });
  };

  // Build phase summaries
  const getImportSummary = (): ImportPhaseSummary | null => {
    if (!transcript) return null;
    const meta = transcript.metadata;
    const formatDuration = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    };
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };
    return {
      sessionTitle: meta.title,
      date: formatDate(meta.date),
      duration: meta.durationSeconds ? formatDuration(meta.durationSeconds) : undefined,
      entryCount: transcript.entries.length,
      hasDiceLog: !!diceLog,
      diceLogRollCount: diceLog?.rollCount,
    };
  };

  const getParseReviewSummary = (): ParseReviewSummary | null => {
    if (!transcript) return null;
    const players = config.players;
    const dmCount = players.filter((p) => p.role === "dm").length;
    const playerCount = players.length - dmCount;
    // Count how many players match saved config (for returning users)
    const matchedCount = players.filter((p) =>
      config.players.some(
        (saved) =>
          saved.playerName.toLowerCase() === p.playerName.toLowerCase() ||
          saved.aliases?.some(
            (a) => a.toLowerCase() === p.playerName.toLowerCase()
          )
      )
    ).length;
    return {
      playerCount,
      dmCount,
      savedNpcCount: config.npcs.length,
      matchedCount: matchedCount > 0 ? matchedCount : 0,
    };
  };

  const getGenerateSummary = (): GeneratePhaseSummary | null => {
    if (!recap || !generationElapsedTime) return null;
    return {
      elapsedTime: generationElapsedTime,
      sceneCount: recap.sceneHighlights?.length ?? recap.scenes?.length ?? 0,
      highlightCount:
        recap.sceneHighlights?.reduce((acc, s) => acc + s.highlights.length, 0) ??
        recap.highlights?.length ??
        0,
      quoteCount: recap.quotes?.length ?? 0,
    };
  };

  const importSummary = getImportSummary();
  const parseReviewSummary = getParseReviewSummary();
  const generateSummary = getGenerateSummary();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
              <Scroll className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1
                className="text-lg font-medium"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Session Scribe
              </h1>
              <p className="text-xs text-muted-foreground -mt-0.5">
                Transform Sessions into Stories
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hasApiKey && !isLoading && (
              <span className="text-sm text-muted-foreground flex items-center gap-1.5 mr-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                Configure API key
              </span>
            )}
            <ZoomControl
              zoom={zoom}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onReset={resetZoom}
              canZoomIn={canZoomIn}
              canZoomOut={canZoomOut}
            />
            <SettingsDialog
              config={config}
              onSave={updateAll}
              detectedSpeakers={detectedSpeakers}
              detectedNPCs={detectedNPCs}
            />
          </div>
        </div>
      </header>

      {/* Main Content - Phase-based flow */}
      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-8 space-y-4">
        {/* Phase 1: Import */}
        <PhaseContainer
          phase="import"
          status={getPhaseStatus("import")}
          isExpanded={phaseState.expanded.includes("import")}
          onToggleExpand={() => toggleExpand("import")}
          scrollIntoView={shouldScrollToPhase.current === "import"}
          summary={
            importSummary && <ImportPhaseSummaryDisplay data={importSummary} />
          }
        >
          <ImportPanel
            transcript={transcript}
            diceLog={diceLog}
            transcriptState={transcriptState}
            diceLogState={diceLogState}
            transcriptError={transcriptError}
            diceLogError={diceLogError}
            onImportTranscript={importTranscript}
            onImportDiceLog={importDiceLog}
            onClearTranscript={handleClearTranscript}
            onClearDiceLog={clearDiceLog}
          />

          {/* Continue button - appears when transcript is loaded */}
          {transcriptState === "success" && !hasConfirmedImport && (
            <div className="flex justify-center pt-6">
              <Button
                size="lg"
                onClick={handleContinueFromImport}
                className="gap-2"
              >
                Continue to Review
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </PhaseContainer>

        {/* Phase 2: Parse Review */}
        <PhaseContainer
          phase="parse-review"
          status={getPhaseStatus("parse-review")}
          isExpanded={phaseState.expanded.includes("parse-review")}
          onToggleExpand={() => toggleExpand("parse-review")}
          scrollIntoView={shouldScrollToPhase.current === "parse-review"}
          summary={
            parseReviewSummary && (
              <ParseReviewSummaryDisplay data={parseReviewSummary} />
            )
          }
        >
          {transcript && (
            <ParseReviewPanel
              transcript={transcript}
              players={config.players}
              savedNpcs={config.npcs}
              savedPlayers={config.players}
              hasApiKey={hasApiKey}
              outputFilename={outputFilename}
              onOutputFilenameChange={setOutputFilename}
              onPlayersChange={handlePlayersChange}
              onGenerate={handleGenerate}
            />
          )}
        </PhaseContainer>

        {/* Phase 3: Generate */}
        <PhaseContainer
          phase="generate"
          status={getPhaseStatus("generate")}
          isExpanded={phaseState.expanded.includes("generate")}
          onToggleExpand={() => toggleExpand("generate")}
          scrollIntoView={shouldScrollToPhase.current === "generate"}
          summary={
            generateSummary && (
              <GeneratePhaseSummaryDisplay data={generateSummary} />
            )
          }
        >
          {isGenerating && (
            <GenerationProgress
              progress={progress}
              startTime={generationStartTime}
            />
          )}
          {summarizerState === "error" && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
              <div className="text-center space-y-2">
                <h3
                  className="text-lg text-destructive"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Chronicle Failed
                </h3>
                <p className="text-sm text-muted-foreground">{summarizerError}</p>
              </div>
            </div>
          )}
        </PhaseContainer>

        {/* Phase 4: Output */}
        <PhaseContainer
          phase="output"
          status={getPhaseStatus("output")}
          isExpanded={phaseState.expanded.includes("output")}
          onToggleExpand={() => toggleExpand("output")}
          scrollIntoView={shouldScrollToPhase.current === "output"}
        >
          {recap && (
            <OutputPanel
              recap={recap}
              detectedNpcs={detectedNPCs}
              savedNpcs={config.npcs}
              outputFilename={outputFilename}
              onSaveNpc={handleSaveNpc}
              onRegenerate={handleRegenerate}
            />
          )}
        </PhaseContainer>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-auto">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <p className="text-xs text-muted-foreground/50 text-center">
            Every great adventure deserves to be remembered
          </p>
        </div>
      </footer>
    </div>
  );
}
