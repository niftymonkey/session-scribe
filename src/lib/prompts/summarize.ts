import type { TranscriptEntry, PlayerConfig } from "@/types";

export interface ChunkEvent {
  description: string;
  character: string | null;
  items: string[];
  goldAmounts: string[];
}

export interface SceneTransition {
  type: "location" | "time" | "situation";
  description: string;
}

export interface ChunkSummary {
  timeRange: string;
  events: ChunkEvent[];
  quotes: Array<{ speaker: string; text: string; context: string | null }>;
  locations: string[];
  enemies: string[];
  timeProgressions: string[];
  sceneTransitions: SceneTransition[];
}

/**
 * Build the prompt for summarizing a single chunk of transcript
 */
export function buildChunkPrompt(
  entries: TranscriptEntry[],
  playerMap: PlayerConfig[],
  chunkIndex: number,
  totalChunks: number
): string {
  const playerContext = buildPlayerContext(playerMap);
  const transcriptText = formatTranscriptEntries(entries, playerMap);

  const timeStart = entries[0]?.timestamp ?? "0:00";
  const timeEnd = entries[entries.length - 1]?.timestamp ?? "unknown";

  return `## Chunk ${chunkIndex + 1} of ${totalChunks} (${timeStart} - ${timeEnd})

${playerContext}

## Transcript
${transcriptText}

## Instructions
Extract ALL events from this transcript segment. Do not summarize - be EXHAUSTIVE.

For EACH event, capture:
- The specific action or occurrence (with exact item names, quantities, gold amounts)
- Which character performed or was involved in the action
- Any items mentioned (with quantities and costs if stated)
- Any gold amounts mentioned (e.g., "1000gp line of credit", "10gp in cart")

Also extract:
- ALL locations mentioned in this segment
- ALL enemies or NPCs encountered/mentioned
- ANY time progression mentions (Day X, morning/afternoon/evening/night, "the next day", etc.)
- Scene transitions (when the party moves to a new location, significant time passes, or the situation fundamentally changes)

IMPORTANT: Do not limit the number of events. Extract EVERY distinct occurrence, action, discovery, or decision. Preserve specific names, numbers, and details exactly as mentioned.

Respond with JSON:
{
  "timeRange": "${timeStart} - ${timeEnd}",
  "events": [
    {"description": "detailed event description", "character": "Character Name or null", "items": ["Misty's Pulse Bracer", "Calming Dust x3"], "goldAmounts": ["1000gp line of credit"]}
  ],
  "quotes": [{"speaker": "Character Name", "text": "the quote", "context": "brief context"}],
  "locations": ["The Gilded Gnome", "Market District"],
  "enemies": ["Barbed Devil", "Cultist"],
  "timeProgressions": ["Day 3", "evening"],
  "sceneTransitions": [{"type": "location", "description": "Party left the tavern and entered the market"}]
}`;
}

/**
 * Build the prompt for synthesizing chunk summaries into final recap
 */
export function buildSynthesisPrompt(
  chunkSummaries: ChunkSummary[],
  sessionTitle: string,
  playerMap: PlayerConfig[]
): string {
  const playerContext = buildPlayerContext(playerMap);
  const summariesText = chunkSummaries
    .map((s, i) => `### Chunk ${i + 1} (${s.timeRange})\n${JSON.stringify(s, null, 2)}`)
    .join("\n\n");

  return `## Session: ${sessionTitle}

${playerContext}

## Extracted Events from All Chunks
${summariesText}

## Instructions
Organize the extracted events into a structured, exhaustive session recap.

### 1. SCENES
Identify distinct SCENES based on location changes, significant time jumps, or major situation changes.
For each scene, list:
- A descriptive name (e.g., "Shopping at the Gilded Gnome", "Ambush in the Sewers")
- Which characters were present
- Location(s)
- Enemies/NPCs encountered

### 2. OPENING CONTEXT
Create an opening context section that describes:
- Where the party was at the start of the session
- What objectives or goals they had

### 3. SCENE HIGHLIGHTS (This is the main content - be EXHAUSTIVE)
For EACH scene, create a section with:
- Scene name
- Characters present
- Time of day (if known)
- Highlights: A list of key events with NESTED sub-bullets for sequential sub-events

IMPORTANT: Preserve ALL specific details from the extraction:
- Exact item names (e.g., "Misty's Pulse Bracer", not just "a bracer")
- Gold amounts (e.g., "1000gp line of credit", "10gp found in cart")
- Character-specific actions (e.g., "Samuel disarmed the trap", not "the party disarmed the trap")

Use nested bullets when events are sequential or related:
- "The party entered the shop"
  - "Aurelion purchased Calming Dust (3 doses) for 15gp each"
  - "Killian examined the enchanted weapons on display"

### 4. LEGACY HIGHLIGHTS
Also provide 5-8 categorized highlights (combat, roleplay, discovery, decision, humor) for backwards compatibility.

### 5. QUOTES
Select the 3-5 best quotes from all chunks.

### 6. NARRATIVE
Write 2-3 paragraphs telling the session's story.

Respond with JSON:
{
  "scenes": [{"name": "Scene Name", "characters": ["Char1"], "locations": ["Location"], "enemies": ["Enemy"]}],
  "openingContext": {"startingState": "The party was...", "objectives": ["Find the artifact", "Meet the contact"]},
  "sceneHighlights": [
    {
      "sceneName": "Scene Name",
      "charactersPresent": ["Char1", "Char2"],
      "timeOfDay": "morning",
      "highlights": [
        {"text": "Main event description", "subBullets": ["Sub-detail 1", "Sub-detail 2"]}
      ]
    }
  ],
  "highlights": [{"category": "combat|roleplay|discovery|decision|humor", "description": "...", "participants": ["Char1"]}],
  "quotes": [{"speaker": "Character Name", "text": "...", "context": "..."}],
  "narrative": "2-3 paragraphs..."
}`;
}

/**
 * Build a single-pass prompt for processing the entire transcript at once
 */
export function buildSinglePassPrompt(
  entries: TranscriptEntry[],
  sessionTitle: string,
  playerMap: PlayerConfig[]
): string {
  const playerContext = buildPlayerContext(playerMap);
  const transcriptText = formatTranscriptEntries(entries, playerMap);

  return `## Session: ${sessionTitle}

${playerContext}

## Full Transcript
${transcriptText}

## Instructions
Analyze this COMPLETE session transcript and create an exhaustive, scene-based recap.

### 1. SCENES
Identify distinct SCENES based on location changes, significant time jumps, or major situation changes.
For each scene, list:
- A descriptive name (e.g., "Shopping at the Gilded Gnome", "Ambush in the Sewers")
- Which characters were present
- Location(s)
- Enemies/NPCs encountered

### 2. OPENING CONTEXT
Create an opening context section that describes:
- Where the party was at the start of the session
- What objectives or goals they had

### 3. SCENE HIGHLIGHTS (This is the main content - be EXHAUSTIVE)
For EACH scene, create a section with:
- Scene name
- Characters present
- Time of day (if known)
- Highlights: A list of ALL key events with NESTED sub-bullets for sequential sub-events

CRITICAL - Extract ALL specific details:
- Exact item names (e.g., "Misty's Pulse Bracer", not just "a bracer")
- Gold amounts (e.g., "1000gp line of credit", "10gp found in cart")
- Character-specific actions (e.g., "Samuel disarmed the trap", not "the party disarmed the trap")
- Quantities (e.g., "3 doses of Calming Dust")

Use nested bullets when events are sequential or related:
- "The party entered the shop"
  - "Aurelion purchased Calming Dust (3 doses) for 15gp each"
  - "Killian examined the enchanted weapons on display"

### 4. LEGACY HIGHLIGHTS
Also provide 5-8 categorized highlights (combat, roleplay, discovery, decision, humor) for backwards compatibility.

### 5. QUOTES
Select the 3-5 best memorable in-character quotes.

### 6. NARRATIVE
Write 2-3 paragraphs telling the session's story.

Respond with JSON:
{
  "scenes": [{"name": "Scene Name", "characters": ["Char1"], "locations": ["Location"], "enemies": ["Enemy"]}],
  "openingContext": {"startingState": "The party was...", "objectives": ["Find the artifact", "Meet the contact"]},
  "sceneHighlights": [
    {
      "sceneName": "Scene Name",
      "charactersPresent": ["Char1", "Char2"],
      "timeOfDay": "morning",
      "highlights": [
        {"text": "Main event description", "subBullets": ["Sub-detail 1", "Sub-detail 2"]}
      ]
    }
  ],
  "highlights": [{"category": "combat|roleplay|discovery|decision|humor", "description": "...", "participants": ["Char1"]}],
  "quotes": [{"speaker": "Character Name", "text": "...", "context": "..."}],
  "narrative": "2-3 paragraphs..."
}`;
}

function buildPlayerContext(playerMap: PlayerConfig[]): string {
  if (playerMap.length === 0) {
    return "## Players\nNo player mapping provided.";
  }

  const dm = playerMap.find(p => p.role === "dm");
  const players = playerMap.filter(p => p.role === "player");

  let context = "## Players\n";
  if (dm) {
    const dmName = dm.characterName ?? "Dungeon Master";
    context += `- ${dm.playerName} is the DM (referred to as "${dmName}")\n`;
  }
  for (const p of players) {
    context += `- ${p.playerName} plays ${p.characterName ?? "unknown character"}\n`;
  }
  return context;
}

/**
 * Find a player config by matching against speaker name.
 * Checks playerName, characterName, and aliases (case-insensitive).
 */
function findPlayerBySpeaker(
  speaker: string,
  playerMap: PlayerConfig[]
): PlayerConfig | undefined {
  const normalize = (value: string) => value.trim().toLowerCase();
  const speakerNorm = normalize(speaker);
  return playerMap.find(
    (p) =>
      normalize(p.playerName) === speakerNorm ||
      (p.characterName && normalize(p.characterName) === speakerNorm) ||
      p.aliases?.some((a) => normalize(a) === speakerNorm)
  );
}

function formatTranscriptEntries(entries: TranscriptEntry[], playerMap: PlayerConfig[]): string {
  return entries
    .map(entry => {
      const player = findPlayerBySpeaker(entry.speaker, playerMap);

      let speakerLabel: string;
      if (player?.role === "dm") {
        // DM: Mark clearly as DM with their display name
        speakerLabel = `[DM] ${player.characterName ?? "Dungeon Master"}`;
      } else if (player) {
        // Player: Use character name (consistent for narratives)
        speakerLabel = player.characterName ?? entry.speaker;
      } else {
        // Unknown speaker: keep raw name
        speakerLabel = entry.speaker;
      }

      return `[${entry.timestamp}] ${speakerLabel}: ${entry.text}`;
    })
    .join("\n");
}
