import { readTextFile, writeTextFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import type { AppConfig } from "@/types";
import { defaultConfig } from "@/types";

const CONFIG_FILENAME = "config.json";

async function getConfigPath(): Promise<string> {
  const appData = await appDataDir();
  return join(appData, CONFIG_FILENAME);
}

async function ensureAppDataDir(): Promise<void> {
  const appData = await appDataDir();
  const dirExists = await exists(appData);
  if (!dirExists) {
    await mkdir(appData, { recursive: true });
  }
}

export async function loadConfig(): Promise<AppConfig> {
  try {
    const configPath = await getConfigPath();
    const configExists = await exists(configPath);

    if (!configExists) {
      return { ...defaultConfig };
    }

    const content = await readTextFile(configPath);
    const parsed = JSON.parse(content) as Partial<AppConfig>;

    // Merge with defaults to ensure all fields exist
    return {
      ...defaultConfig,
      ...parsed,
      campaign: {
        ...defaultConfig.campaign,
        ...parsed.campaign,
      },
      players: parsed.players || defaultConfig.players,
    };
  } catch (error) {
    console.error("Failed to load config:", error);
    return { ...defaultConfig };
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const configPath = await getConfigPath();
  try {
    await ensureAppDataDir();
    const content = JSON.stringify(config, null, 2);
    await writeTextFile(configPath, content);
  } catch (error) {
    console.error("Failed to save config:", error);
    throw error;
  }
}

export async function updateConfig(updates: Partial<AppConfig>): Promise<AppConfig> {
  const current = await loadConfig();
  const updated: AppConfig = {
    ...current,
    ...updates,
    campaign: {
      ...current.campaign,
      ...updates.campaign,
    },
    players: updates.players ?? current.players,
  };
  await saveConfig(updated);
  return updated;
}
