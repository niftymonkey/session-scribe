import type { TranscriptEntry, PlayerConfig } from "@/types";
import type { DiscoveredScene, SceneDetails } from "@/types/multi-pass";

function buildPlayerContext(playerMap: PlayerConfig[]): string {
  if (playerMap.length === 0) {
    return "## Players\nNo player mapping provided.";
  }

  const dm = playerMap.find((p) => p.role === "dm");
  const players = playerMap.filter((p) => p.role === "player");

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

function formatTranscriptEntries(
  entries: TranscriptEntry[],
  playerMap: PlayerConfig[]
): string {
  return entries
    .map((entry) => {
      const character = playerMap.find(
        (p) => p.playerName.toLowerCase() === entry.speaker.toLowerCase()
      );
      const speakerLabel =
        character?.role === "dm"
          ? `[DM] ${entry.speaker} (${character.characterName ?? "Dungeon Master"})`
          : character?.characterName
            ? `${entry.speaker} (${character.characterName})`
            : entry.speaker;

      return `[${entry.timestamp}] ${speakerLabel}: ${entry.text}`;
    })
    .join("\n");
}

/**
 * Pass 1: Scene Discovery
 * Identifies scene boundaries based on location changes, time jumps, or major situation changes.
 */
export function buildPass1Prompt(
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

## Instructions - Scene Discovery (Pass 1 of 3)

Your task is to identify the DISTINCT SCENES in this D&D session transcript.

A new scene begins when:
- The party moves to a new location (e.g., leaving a tavern, entering a dungeon)
- Significant time passes (e.g., "the next morning", "after a long rest")
- The situation fundamentally changes (e.g., combat starts, a negotiation begins)

For EACH scene, provide:
- **name**: A descriptive name (e.g., "Shopping at the Gilded Gnome", "Ambush in the Sewers")
- **startTimestampSeconds**: The timestamp (in seconds) where this scene begins
- **endTimestampSeconds**: The timestamp (in seconds) where this scene ends
- **location**: The primary location of the scene
- **characters**: Which player characters are present/active in this scene

IMPORTANT:
- Scenes should be contiguous (no gaps between end of one and start of next)
- First scene should start at 0 or the first entry's timestamp
- Last scene should end at the final entry's timestamp
- Aim for 3-8 scenes for a typical session - don't over-segment`;
}

/**
 * Pass 2: Detail Extraction (per scene)
 * Exhaustively extracts events, items, quotes from a single scene.
 */
export function buildPass2Prompt(
  entries: TranscriptEntry[],
  scene: DiscoveredScene,
  playerMap: PlayerConfig[]
): string {
  const playerContext = buildPlayerContext(playerMap);
  const transcriptText = formatTranscriptEntries(entries, playerMap);

  const timeStart = entries[0]?.timestamp ?? "0:00";
  const timeEnd = entries[entries.length - 1]?.timestamp ?? "unknown";

  return `## Scene: ${scene.name}
## Location: ${scene.location}
## Time Range: ${timeStart} - ${timeEnd}

${playerContext}

## Transcript for This Scene
${transcriptText}

## Instructions - Detail Extraction (Pass 2 of 3)

Extract ALL details from this scene segment. Be EXHAUSTIVE - do not summarize.

### Events
For EACH event in this scene, capture:
- **description**: The specific action or occurrence (with exact item names, quantities, gold amounts)
- **character**: Which character performed or was involved (null if general/party action)
- **items**: Any items mentioned (with quantities and costs if stated)
- **goldAmounts**: Any gold amounts mentioned (e.g., "1000gp line of credit", "10gp")

### Quotes
Extract memorable in-character quotes:
- **speaker**: The character name (not player name)
- **text**: The exact quote
- **context**: Brief context for why this quote matters

### Other Details
- **timeOfDay**: If mentioned (morning, afternoon, evening, night)
- **enemies**: Any enemies or hostile NPCs encountered

IMPORTANT:
- Do not limit the number of events. Extract EVERY distinct occurrence.
- Preserve specific names, numbers, and details EXACTLY as mentioned.
- Character-specific actions are better than "the party did X".`;
}

/**
 * Pass 3: Synthesis
 * Combines scene structure and extracted details into final recap format.
 */
export function buildPass3Prompt(
  scenes: DiscoveredScene[],
  sceneDetails: SceneDetails[],
  sessionTitle: string,
  playerMap: PlayerConfig[]
): string {
  const playerContext = buildPlayerContext(playerMap);

  // Format scenes overview
  const scenesOverview = scenes
    .map(
      (s, i) =>
        `### Scene ${i + 1}: ${s.name}\n- Location: ${s.location}\n- Characters: ${s.characters.join(", ")}`
    )
    .join("\n\n");

  // Format extracted details
  const detailsText = sceneDetails
    .map((d, i) => {
      const eventsText = d.events
        .map(
          (e) =>
            `  - ${e.description}${e.character ? ` (${e.character})` : ""}${e.items.length ? ` [Items: ${e.items.join(", ")}]` : ""}${e.goldAmounts.length ? ` [Gold: ${e.goldAmounts.join(", ")}]` : ""}`
        )
        .join("\n");

      const quotesText = d.quotes
        .map((q) => `  - "${q.text}" - ${q.speaker}${q.context ? ` (${q.context})` : ""}`)
        .join("\n");

      return `### Scene ${i + 1}: ${d.sceneName}
Characters: ${d.charactersPresent.join(", ")}
Time of Day: ${d.timeOfDay ?? "unknown"}
Enemies: ${d.enemies.length ? d.enemies.join(", ") : "none"}

Events:
${eventsText}

Quotes:
${quotesText || "  (none extracted)"}`;
    })
    .join("\n\n---\n\n");

  return `## Session: ${sessionTitle}

${playerContext}

## Discovered Scenes
${scenesOverview}

## Extracted Details
${detailsText}

## Instructions - Synthesis (Pass 3 of 3)

Organize the extracted information into a polished session recap.

**CRITICAL - Use CHARACTER NAMES, not player names:**
- Always use the character name or role (e.g., "DM", "Dungeon Master", "Aurelion") instead of player names (e.g., "Micco Fay", "Samuel Frost")
- For the DM, use their display name (usually "DM" or "Dungeon Master") as shown in the Players section above
- This applies to ALL fields: characters, participants, speakers, etc.

### 1. SCENES
Create the final scene list with:
- name, characters (use CHARACTER names), locations (can be multiple), enemies

### 2. OPENING CONTEXT
Describe:
- **startingState**: Where the party was at session start
- **objectives**: What goals or missions they had

### 3. SCENE HIGHLIGHTS (Main Content)
For EACH scene, create highlights with NESTED sub-bullets for related events:
- Group sequential or related events together
- Use sub-bullets for details (e.g., purchases, combat actions, discoveries)
- Preserve ALL specific details: exact item names, gold amounts, character actions
- Use CHARACTER names, not player names

Example format:
- "The party visited The Gilded Gnome magic shop"
  - "Aurelion purchased Calming Dust (3 doses) for 15gp each"
  - "Killian examined the enchanted weapons but decided against buying"

### 4. LEGACY HIGHLIGHTS
Provide 5-8 categorized highlights (combat, roleplay, discovery, decision, humor).
- Use CHARACTER names for participants

### 5. QUOTES
Select the 3-5 best quotes from all extracted quotes.
- Use CHARACTER name as speaker (not player name)

### 6. NARRATIVE
Write 2-3 paragraphs telling the session's story.
- Refer to characters by their CHARACTER names`;
}
