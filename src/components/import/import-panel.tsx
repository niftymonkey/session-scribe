import { FileDropZone } from "./file-drop-zone";
import { TranscriptPreview, DiceLogPreview } from "./import-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TranscriptData, DiceLogData } from "@/types";
import type { ImportState } from "@/hooks/use-file-import";

interface ImportPanelProps {
  transcript: TranscriptData | null;
  diceLog: DiceLogData | null;
  transcriptState: ImportState;
  diceLogState: ImportState;
  transcriptError: string | null;
  diceLogError: string | null;
  onImportTranscript: () => void;
  onImportDiceLog: () => void;
  onClearTranscript: () => void;
  onClearDiceLog: () => void;
}

export function ImportPanel({
  transcript,
  diceLog,
  transcriptState,
  diceLogState,
  transcriptError,
  diceLogError,
  onImportTranscript,
  onImportDiceLog,
  onClearTranscript,
  onClearDiceLog,
}: ImportPanelProps) {
  return (
    <div className="surface-card rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl" style={{ fontFamily: 'var(--font-display)' }}>
          Session Archives
        </h2>
        <p className="text-sm text-muted-foreground">
          Import your session transcript and dice log to begin
        </p>
      </div>

      {/* Drop Zones */}
      <div className="grid gap-5 md:grid-cols-2">
        <FileDropZone
          type="transcript"
          state={transcriptState}
          error={transcriptError}
          hasData={!!transcript}
          onImport={onImportTranscript}
          onClear={onClearTranscript}
          metadata={
            transcript
              ? {
                  title: transcript.metadata.title,
                  entryCount: transcript.entries.length,
                  duration: transcript.metadata.duration,
                  speakers: transcript.speakers,
                }
              : undefined
          }
        />

        <FileDropZone
          type="dice-log"
          state={diceLogState}
          error={diceLogError}
          hasData={!!diceLog}
          onImport={onImportDiceLog}
          onClear={onClearDiceLog}
          metadata={
            diceLog
              ? {
                  title: diceLog.filename,
                  rollCount: diceLog.rollCount,
                  characters: diceLog.characters,
                }
              : undefined
          }
        />
      </div>

      {/* Preview Tabs */}
      {(transcript || diceLog) && (
        <div className="pt-2">
          <Tabs defaultValue={transcript ? "transcript" : "dice-log"}>
            <TabsList className="w-full grid grid-cols-2 bg-secondary/30">
              <TabsTrigger value="transcript" disabled={!transcript} className="data-[state=active]:bg-card">
                Transcript Preview
              </TabsTrigger>
              <TabsTrigger value="dice-log" disabled={!diceLog} className="data-[state=active]:bg-card">
                Dice Log Preview
              </TabsTrigger>
            </TabsList>
            {transcript && (
              <TabsContent value="transcript" className="mt-4 animate-fade-in">
                <TranscriptPreview transcript={transcript} />
              </TabsContent>
            )}
            {diceLog && (
              <TabsContent value="dice-log" className="mt-4 animate-fade-in">
                <DiceLogPreview diceLog={diceLog} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
}
