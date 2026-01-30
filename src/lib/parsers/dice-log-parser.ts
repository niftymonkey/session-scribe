import type { DiceLogData, DiceLogEntry, DiceRoll, TurnMarker } from "@/types";

/**
 * Parse a turn marker line
 * Formats: "Character, it's now your turn!" or "Character's turn is done."
 */
export function parseTurnMarker(line: string): TurnMarker | null {
  // Check for turn start: "Character, it's now your turn!"
  const turnStartMatch = line.match(/^(.+?),\s*it's now your turn!$/i);
  if (turnStartMatch) {
    return { character: turnStartMatch[1].trim(), round: undefined };
  }

  // Check for turn end: "Character's turn is done."
  const turnEndMatch = line.match(/^(.+?)'s turn is done\.$/i);
  if (turnEndMatch) {
    return { character: turnEndMatch[1].trim(), round: undefined };
  }

  return null;
}

/**
 * Parse a dice roll block
 * Format varies but generally:
 * - Character header (e.g., "Liam AC:15 PP:15 DC:13:")
 * - Character full name
 * - Roll type (e.g., "Perception Check")
 * - Roll result(s)
 * - "Details"
 */
export function parseRollBlock(block: string): DiceRoll | null {
  const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 3) return null;

  // Check for GM roll format
  if (lines[0].startsWith("Storyteller (GM):")) {
    const rollMatch = block.match(/=(\d+)/);
    if (rollMatch) {
      return {
        character: "Storyteller (GM)",
        rollType: "GM Roll",
        result: parseInt(rollMatch[1]),
      };
    }
    return null;
  }

  // Check for player roll format - starts with character info header ending in ":"
  if (!lines[0].endsWith(":")) return null;

  // Find character name (usually the line after the header)
  let characterName = "";
  let rollType = "";
  let result = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip "Details" and similar
    if (line === "Details" || line === "Damage") continue;

    // Check if this is a roll type (contains "Check", "Saving Throw", "Attack", etc.)
    if (
      line.includes("Check") ||
      line.includes("Saving Throw") ||
      line.includes("Attack") ||
      line.includes("Tool")
    ) {
      rollType = line;
      continue;
    }

    // Check if this is a number (roll result)
    const num = parseInt(line);
    if (!isNaN(num) && result === 0) {
      result = num;
      continue;
    }

    // Otherwise, it might be the character name (first non-header, non-check line)
    if (!characterName && !line.includes("AC:") && !line.includes("PP:")) {
      characterName = line;
    }
  }

  if (!characterName || result === 0) return null;

  return {
    character: characterName,
    rollType: rollType || "Unknown",
    result,
  };
}

/**
 * Parse a Roll20 dice log into structured data
 */
export function parseDiceLog(content: string): DiceLogData {
  if (!content.trim()) {
    return {
      entries: [],
      characters: [],
      rollCount: 0,
    };
  }

  const entries: DiceLogEntry[] = [];
  const charactersSet = new Set<string>();
  let rollCount = 0;

  // Split content into blocks separated by ":" on its own line or double newlines
  const lines = content.split("\n");
  let currentBlock: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for turn markers first
    const turnMarker = parseTurnMarker(line);
    if (turnMarker) {
      // Process any accumulated block first
      if (currentBlock.length > 0) {
        const blockText = currentBlock.join("\n");
        const roll = parseRollBlock(blockText);
        if (roll) {
          entries.push({ type: "roll", data: roll, raw: blockText });
          charactersSet.add(roll.character);
          rollCount++;
        }
        currentBlock = [];
      }

      entries.push({ type: "turn", data: turnMarker, raw: line });
      continue;
    }

    // Skip certain lines
    if (
      line === "⏪ POTEOT ⏩" ||
      line.startsWith("Round ") ||
      line === "Reset ↺" ||
      line === ":"
    ) {
      // End current block if we have one
      if (currentBlock.length > 0) {
        const blockText = currentBlock.join("\n");
        const roll = parseRollBlock(blockText);
        if (roll) {
          entries.push({ type: "roll", data: roll, raw: blockText });
          charactersSet.add(roll.character);
          rollCount++;
        }
        currentBlock = [];
      }
      continue;
    }

    // Accumulate lines for the current block
    if (line) {
      currentBlock.push(line);
    }
  }

  // Process final block
  if (currentBlock.length > 0) {
    const blockText = currentBlock.join("\n");
    const roll = parseRollBlock(blockText);
    if (roll) {
      entries.push({ type: "roll", data: roll, raw: blockText });
      charactersSet.add(roll.character);
      rollCount++;
    }
  }

  return {
    entries,
    characters: Array.from(charactersSet),
    rollCount,
  };
}
