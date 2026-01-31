export interface CampaignInfo {
  name: string;
  currentBook?: number;
  currentAct?: number;
}

export interface PlayerConfig {
  playerName: string;
  characterName: string | null;
  role: "dm" | "player";
  aliases?: string[];
}

export interface NPCConfig {
  name: string;
  aliases: string[];
}

export interface AppConfig {
  openaiApiKey: string;
  campaign: CampaignInfo;
  players: PlayerConfig[];
  npcs: NPCConfig[];
  selectedModel?: string; // OpenAI model ID, e.g., "gpt-4o"
}

export const defaultConfig: AppConfig = {
  openaiApiKey: "",
  campaign: {
    name: "",
    currentBook: undefined,
    currentAct: undefined,
  },
  players: [],
  npcs: [],
};
