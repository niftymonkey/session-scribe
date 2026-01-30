export interface DiscoveredScene {
  name: string;
  startTimestampSeconds: number;
  endTimestampSeconds: number;
  location: string;
  characters: string[];
}

export interface SceneDetails {
  sceneName: string;
  charactersPresent: string[];
  timeOfDay: string | null;
  events: Array<{
    description: string;
    character: string | null;
    items: string[];
    goldAmounts: string[];
  }>;
  quotes: Array<{
    speaker: string;
    text: string;
    context: string | null;
  }>;
  enemies: string[];
}

export interface Pass1Result {
  scenes: DiscoveredScene[];
}

export interface Pass2Result {
  sceneDetails: SceneDetails[];
}

export interface Pass3Result {
  scenes: Array<{
    name: string;
    characters: string[];
    locations: string[];
    enemies: string[];
  }>;
  openingContext: {
    startingState: string;
    objectives: string[];
  };
  sceneHighlights: Array<{
    sceneName: string;
    charactersPresent: string[];
    timeOfDay: string | null;
    highlights: Array<{
      text: string;
      subBullets: string[];
    }>;
  }>;
  highlights: Array<{
    category: "combat" | "roleplay" | "discovery" | "decision" | "humor";
    description: string;
    participants: string[] | null;
  }>;
  quotes: Array<{
    speaker: string;
    text: string;
    context: string | null;
  }>;
  narrative: string;
}
