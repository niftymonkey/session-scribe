export interface CampaignInfo {
  name: string;
  currentBook?: number;
  currentAct?: number;
}

export interface PlayerConfig {
  playerName: string;
  characterName: string | null;
  role: "dm" | "player";
}

export interface AppConfig {
  openaiApiKey: string;
  campaign: CampaignInfo;
  players: PlayerConfig[];
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
};
