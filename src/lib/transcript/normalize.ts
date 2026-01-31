import type { TranscriptData, TranscriptEntry, PlayerConfig, NPCConfig } from "@/types";

interface NormalizationResult {
  transcript: TranscriptData;
  appliedMappings: {
    speakers: Map<string, string>;
    npcs: Map<string, string>;
  };
}

/**
 * Build a case-insensitive lookup map from aliases to canonical names.
 * Sorts by alias length (longest first) to prevent partial matches.
 */
function buildAliasMap(
  items: { name: string; aliases: string[] }[]
): Map<string, string> {
  // Collect all aliases with their canonical names
  const pairs: [string, string][] = [];
  for (const item of items) {
    for (const alias of item.aliases) {
      pairs.push([alias.toLowerCase(), item.name]);
    }
  }
  // Sort by alias length descending (longest first) to prevent partial replacements
  pairs.sort((a, b) => b[0].length - a[0].length);

  return new Map(pairs);
}

/**
 * Build speaker alias map from player configs.
 * Maps player aliases -> playerName (canonical speaker name in transcript).
 */
function buildSpeakerAliasMap(players: PlayerConfig[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const player of players) {
    if (player.aliases) {
      for (const alias of player.aliases) {
        map.set(alias.toLowerCase(), player.playerName);
      }
    }
  }
  return map;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace NPC aliases in text with canonical names.
 * Uses a single-pass replacement to avoid re-matching already replaced text.
 * Word boundaries are handled to avoid partial word matches.
 */
function replaceNPCsInText(text: string, npcMap: Map<string, string>): string {
  if (npcMap.size === 0) return text;

  // Build a single regex that matches all aliases (sorted by length, longest first)
  const aliases = Array.from(npcMap.keys());
  if (aliases.length === 0) return text;

  // Create alternation pattern with word boundaries
  // Using (?<![\\p{L}]) and (?![\\p{L}]) for Unicode-aware word boundaries
  const pattern = aliases.map(escapeRegex).join("|");
  const regex = new RegExp(`(?<![\\p{L}])(${pattern})(?![\\p{L}])`, "giu");

  return text.replace(regex, (match) => {
    const canonical = npcMap.get(match.toLowerCase());
    return canonical ?? match;
  });
}

/**
 * Normalize a transcript by:
 * 1. Replacing speaker names that match player aliases with canonical player names
 * 2. Replacing NPC aliases in text content with canonical NPC names
 */
export function normalizeTranscript(
  transcript: TranscriptData,
  players: PlayerConfig[],
  npcs: NPCConfig[]
): NormalizationResult {
  const speakerMap = buildSpeakerAliasMap(players);
  const npcMap = buildAliasMap(npcs);

  const appliedSpeakerMappings = new Map<string, string>();
  const appliedNPCMappings = new Map<string, string>();

  const normalizedEntries: TranscriptEntry[] = transcript.entries.map((entry) => {
    let normalizedSpeaker = entry.speaker;
    let normalizedText = entry.text;

    // Normalize speaker name
    const speakerLower = entry.speaker.toLowerCase();
    if (speakerMap.has(speakerLower)) {
      const canonical = speakerMap.get(speakerLower)!;
      if (canonical !== entry.speaker) {
        appliedSpeakerMappings.set(entry.speaker, canonical);
        normalizedSpeaker = canonical;
      }
    }

    // Normalize NPC names in text
    const beforeText = normalizedText;
    normalizedText = replaceNPCsInText(normalizedText, npcMap);

    // Track which NPC mappings were applied
    if (beforeText !== normalizedText) {
      for (const [alias, canonical] of npcMap) {
        // Check if this alias was in the original text (case-insensitive)
        const aliasRegex = new RegExp(`(?<![\\p{L}])${escapeRegex(alias)}(?![\\p{L}])`, "giu");
        if (aliasRegex.test(beforeText)) {
          appliedNPCMappings.set(alias, canonical);
        }
      }
    }

    return {
      ...entry,
      speaker: normalizedSpeaker,
      text: normalizedText,
    };
  });

  // Update speakers list
  const normalizedSpeakers = Array.from(
    new Set(normalizedEntries.map((e) => e.speaker))
  );

  return {
    transcript: {
      ...transcript,
      entries: normalizedEntries,
      speakers: normalizedSpeakers,
    },
    appliedMappings: {
      speakers: appliedSpeakerMappings,
      npcs: appliedNPCMappings,
    },
  };
}
