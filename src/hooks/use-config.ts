import { useState, useEffect, useCallback } from "react";
import type { AppConfig, PlayerConfig, NPCConfig, CampaignInfo } from "@/types";
import { defaultConfig } from "@/types";
import { loadConfig, saveConfig } from "@/lib/config/config-store";

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig()
      .then((loaded) => {
        setConfig(loaded);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load config:", err);
        setError("Failed to load configuration");
        setIsLoading(false);
      });
  }, []);

  const updateApiKey = useCallback(async (apiKey: string) => {
    setConfig((prev) => {
      const updated = { ...prev, openaiApiKey: apiKey };
      saveConfig(updated);
      return updated;
    });
  }, []);

  const updateCampaign = useCallback(async (campaign: Partial<CampaignInfo>) => {
    setConfig((prev) => {
      const updated = {
        ...prev,
        campaign: { ...prev.campaign, ...campaign },
      };
      saveConfig(updated);
      return updated;
    });
  }, []);

  const updatePlayers = useCallback(async (players: PlayerConfig[]) => {
    setConfig((prev) => {
      const updated = { ...prev, players };
      saveConfig(updated);
      return updated;
    });
  }, []);

  // Batch update all settings at once (avoids race conditions)
  const updateAll = useCallback(async (updates: {
    apiKey?: string;
    campaign?: Partial<CampaignInfo>;
    players?: PlayerConfig[];
    npcs?: NPCConfig[];
    selectedModel?: string;
  }) => {
    setConfig((prev) => {
      const updated: AppConfig = {
        ...prev,
        openaiApiKey: updates.apiKey ?? prev.openaiApiKey,
        campaign: { ...prev.campaign, ...updates.campaign },
        players: updates.players ?? prev.players,
        npcs: updates.npcs ?? prev.npcs,
        selectedModel: updates.selectedModel ?? prev.selectedModel,
      };
      saveConfig(updated);
      return updated;
    });
  }, []);

  const addPlayer = useCallback(async (player: PlayerConfig) => {
    const updated = {
      ...config,
      players: [...config.players, player],
    };
    setConfig(updated);
    await saveConfig(updated);
  }, [config]);

  const removePlayer = useCallback(async (playerName: string) => {
    const updated = {
      ...config,
      players: config.players.filter((p) => p.playerName !== playerName),
    };
    setConfig(updated);
    await saveConfig(updated);
  }, [config]);

  const updatePlayer = useCallback(async (playerName: string, updates: Partial<PlayerConfig>) => {
    const updated = {
      ...config,
      players: config.players.map((p) =>
        p.playerName === playerName ? { ...p, ...updates } : p
      ),
    };
    setConfig(updated);
    await saveConfig(updated);
  }, [config]);

  const hasApiKey = Boolean(config.openaiApiKey);

  const getCharacterName = useCallback((playerName: string): string | undefined => {
    const player = config.players.find(
      (p) => p.playerName.toLowerCase() === playerName.toLowerCase()
    );
    return player?.characterName ?? undefined;
  }, [config.players]);

  return {
    config,
    isLoading,
    error,
    hasApiKey,
    updateApiKey,
    updateCampaign,
    updatePlayers,
    updateAll,
    addPlayer,
    removePlayer,
    updatePlayer,
    getCharacterName,
  };
}
