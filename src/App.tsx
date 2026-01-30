import { Scroll, Sparkles } from "lucide-react";
import { ImportPanel } from "@/components/import/import-panel";
import { SettingsDialog } from "@/components/config/settings-dialog";
import { RecapPanel } from "@/components/recap/recap-panel";
import { useFileImport } from "@/hooks/use-file-import";
import { useConfig } from "@/hooks/use-config";
import { useSummarizer } from "@/hooks/use-summarizer";
import { useZoom } from "@/hooks/use-zoom";
import { Button } from "@/components/ui/button";

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

  const {
    config,
    isLoading,
    hasApiKey,
    updateAll,
  } = useConfig();

  const {
    state: summarizerState,
    recap,
    progress,
    error: summarizerError,
    generate,
    isGenerating,
  } = useSummarizer();

  // Enable zoom with Ctrl+/- and Ctrl+scroll
  useZoom();

  // Get all detected speakers from transcript
  const detectedSpeakers = transcript?.speakers ?? [];

  const canGenerate = transcript && hasApiKey && !isGenerating;

  const handleGenerate = () => {
    if (!transcript || !config.openaiApiKey) return;

    const bookAct = config.campaign.currentBook || config.campaign.currentAct
      ? `Book ${config.campaign.currentBook ?? "?"}, Act ${config.campaign.currentAct ?? "?"}`
      : undefined;

    generate(
      config.openaiApiKey,
      transcript,
      config.players,
      config.campaign.name || undefined,
      bookAct,
      config.selectedModel
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 soft-glow">
              <Scroll className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-glow" style={{ fontFamily: 'var(--font-display)' }}>
                Session Chronicle
              </h1>
              <p className="text-xs text-muted-foreground -mt-0.5">D&D Session Summarizer</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!hasApiKey && !isLoading && (
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                Configure API key
              </span>
            )}
            <SettingsDialog
              config={config}
              onSave={updateAll}
              detectedSpeakers={detectedSpeakers}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* Import Section */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
          <ImportPanel
            transcript={transcript}
            diceLog={diceLog}
            transcriptState={transcriptState}
            diceLogState={diceLogState}
            transcriptError={transcriptError}
            diceLogError={diceLogError}
            onImportTranscript={importTranscript}
            onImportDiceLog={importDiceLog}
            onClearTranscript={clearTranscript}
            onClearDiceLog={clearDiceLog}
          />
        </section>

        {/* Generate Button */}
        <section className="flex flex-col items-center gap-3 py-4 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
          <Button
            size="lg"
            disabled={!canGenerate}
            onClick={handleGenerate}
            className="min-w-56 h-12 text-base gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? "Chronicling..." : "Chronicle This Session"}
          </Button>

          {!canGenerate && !isGenerating && (
            <p className="text-sm text-muted-foreground text-center">
              {!transcript
                ? "Import a session transcript to begin"
                : !hasApiKey
                ? "Add your OpenAI API key in settings"
                : "Ready to chronicle"}
            </p>
          )}
        </section>

        {/* Recap Output */}
        <section className="animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
          <RecapPanel
            state={summarizerState}
            recap={recap}
            progress={progress}
            error={summarizerError}
          />
        </section>
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
