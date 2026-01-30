export interface DiceRoll {
  character: string;
  rollType: string;
  result: number;
  details?: string;
}

export interface TurnMarker {
  character: string;
  round?: number;
}

export interface DiceLogEntry {
  type: "roll" | "turn" | "message";
  data: DiceRoll | TurnMarker | string;
  raw: string;
}

export interface DiceLogData {
  entries: DiceLogEntry[];
  characters: string[];
  rollCount: number;
  filename?: string;
}
