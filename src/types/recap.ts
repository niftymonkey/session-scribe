export interface PlayerCharacter {
  playerName: string;
  characterName: string | null;
  role: "dm" | "player";
}

export interface RecapHeader {
  sessionTitle: string;
  date: Date;
  missionName?: string;
  bookNumber?: number;
  actNumber?: number;
  sessionNumber?: number;
}

export type HighlightCategory =
  | "combat"
  | "roleplay"
  | "discovery"
  | "decision"
  | "humor";

export interface Highlight {
  category: HighlightCategory;
  description: string;
  participants: string[] | null;
}

export interface Quote {
  speaker: string;
  characterName?: string;
  text: string;
  context: string | null;
}

// Scene-based structure for exhaustive extraction
export interface Scene {
  name: string;
  characters: string[];
  locations: string[];
  enemies: string[];
}

export interface SceneHighlight {
  text: string;
  subBullets?: string[];
}

export interface SceneSection {
  sceneName: string;
  charactersPresent: string[];
  timeOfDay?: string;
  highlights: SceneHighlight[];
}

export interface OpeningContext {
  startingState: string;
  objectives: string[];
}

export interface SessionRecap {
  header: RecapHeader;
  attendance: {
    players: PlayerCharacter[];
  };
  metadata: {
    charactersPresent: string[];
    playersPresent: string[];
    inGameTime?: string;
  };
  scenes: Scene[];
  openingContext: OpeningContext;
  sceneHighlights: SceneSection[];
  // Legacy fields for backwards compatibility
  highlights: Highlight[];
  quotes: Quote[];
  narrative: string;
}

export interface RecapGenerationProgress {
  stage: "chunking" | "summarizing" | "synthesizing" | "complete" | "error";
  passName?: "discovery" | "extraction" | "synthesis";
  currentChunk?: number;
  totalChunks?: number;
  currentScene?: number;
  totalScenes?: number;
  message: string;
}
