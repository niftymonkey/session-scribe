import { useState, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile, readFile } from "@tauri-apps/plugin-fs";
import { parseTranscript, parseDiceLog, extractTextFromDocx } from "@/lib/parsers";
import type { TranscriptData, DiceLogData } from "@/types";

export type ImportState = "idle" | "loading" | "success" | "error";

interface UseFileImportResult {
  transcript: TranscriptData | null;
  diceLog: DiceLogData | null;
  transcriptState: ImportState;
  diceLogState: ImportState;
  transcriptError: string | null;
  diceLogError: string | null;
  importTranscript: () => Promise<void>;
  importDiceLog: () => Promise<void>;
  clearTranscript: () => void;
  clearDiceLog: () => void;
  clearAll: () => void;
}

export function useFileImport(): UseFileImportResult {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [diceLog, setDiceLog] = useState<DiceLogData | null>(null);
  const [transcriptState, setTranscriptState] = useState<ImportState>("idle");
  const [diceLogState, setDiceLogState] = useState<ImportState>("idle");
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [diceLogError, setDiceLogError] = useState<string | null>(null);

  const importTranscript = useCallback(async () => {
    try {
      setTranscriptState("loading");
      setTranscriptError(null);

      const filePath = await open({
        multiple: false,
        filters: [
          { name: "Transcript Files", extensions: ["txt", "docx"] },
          { name: "Text Files", extensions: ["txt"] },
          { name: "Word Documents", extensions: ["docx"] },
          { name: "All Files", extensions: ["*"] },
        ],
        title: "Select Transcript File",
      });

      if (!filePath) {
        setTranscriptState("idle");
        return;
      }

      const path = filePath as string;
      const isDocx = path.toLowerCase().endsWith(".docx");

      let content: string;
      if (isDocx) {
        const bytes = await readFile(path);
        content = await extractTextFromDocx(
          bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
        );
      } else {
        content = await readTextFile(path);
      }

      const parsed = parseTranscript(content);

      if (parsed.entries.length === 0) {
        throw new Error("No transcript entries found. Check the file format.");
      }

      setTranscript(parsed);
      setTranscriptState("success");
    } catch (error) {
      console.error("Failed to import transcript:", error);
      setTranscriptError(
        error instanceof Error ? error.message : "Failed to import transcript"
      );
      setTranscriptState("error");
    }
  }, []);

  const importDiceLog = useCallback(async () => {
    try {
      setDiceLogState("loading");
      setDiceLogError(null);

      const filePath = await open({
        multiple: false,
        filters: [
          { name: "Text Files", extensions: ["txt"] },
          { name: "All Files", extensions: ["*"] },
        ],
        title: "Select Dice Log File",
      });

      if (!filePath) {
        setDiceLogState("idle");
        return;
      }

      const content = await readTextFile(filePath as string);
      const parsed = parseDiceLog(content);

      // Extract filename from path
      const filename = (filePath as string).split(/[/\\]/).pop() ?? undefined;

      setDiceLog({ ...parsed, filename });
      setDiceLogState("success");
    } catch (error) {
      console.error("Failed to import dice log:", error);
      setDiceLogError(
        error instanceof Error ? error.message : "Failed to import dice log"
      );
      setDiceLogState("error");
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript(null);
    setTranscriptState("idle");
    setTranscriptError(null);
  }, []);

  const clearDiceLog = useCallback(() => {
    setDiceLog(null);
    setDiceLogState("idle");
    setDiceLogError(null);
  }, []);

  const clearAll = useCallback(() => {
    clearTranscript();
    clearDiceLog();
  }, [clearTranscript, clearDiceLog]);

  return {
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
    clearAll,
  };
}
