import type { TranscriptData } from "./transcript";
import type { DiceLogData } from "./dice-log";

export interface Session {
  id: string;
  title: string;
  date: Date;
  duration: string;
  transcript: TranscriptData;
  diceLog: DiceLogData | null;
}
