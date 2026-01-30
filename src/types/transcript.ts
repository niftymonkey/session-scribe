export interface TranscriptEntry {
  speaker: string;
  characterName?: string;
  timestamp: string;
  timestampSeconds: number;
  text: string;
  isInCharacter?: boolean;
}

export interface TranscriptMetadata {
  title: string;
  date: Date;
  duration: string;
  durationSeconds: number;
}

export interface TranscriptData {
  metadata: TranscriptMetadata;
  entries: TranscriptEntry[];
  speakers: string[];
}
