import type { SessionRecap } from "@/types";

/**
 * Convert a SessionRecap to markdown format
 */
export function recapToMarkdown(recap: SessionRecap): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${recap.header.sessionTitle}`);
  lines.push("");
  lines.push(`**Date:** ${recap.header.date.toLocaleDateString()}`);
  if (recap.header.missionName) {
    lines.push(`**Mission:** ${recap.header.missionName}`);
  }
  if (recap.header.bookNumber || recap.header.actNumber) {
    const bookAct = [
      recap.header.bookNumber && `Book ${recap.header.bookNumber}`,
      recap.header.actNumber && `Act ${recap.header.actNumber}`,
    ].filter(Boolean).join(", ");
    lines.push(`**Campaign:** ${bookAct}`);
  }
  lines.push("");

  // Attendance
  lines.push("## Attendance");
  lines.push("");
  const dm = recap.attendance.players.find(p => p.role === "dm");
  if (dm) {
    lines.push(`- **DM:** ${dm.playerName}`);
  }
  const players = recap.attendance.players.filter(p => p.role === "player");
  for (const player of players) {
    lines.push(`- ${player.playerName} as ${player.characterName ?? "Unknown"}`);
  }
  lines.push("");

  // Highlights
  lines.push("## Key Highlights");
  lines.push("");
  for (const highlight of recap.highlights) {
    const emoji = getCategoryEmoji(highlight.category);
    const participants = highlight.participants?.length
      ? ` *(${highlight.participants.join(", ")})*`
      : "";
    lines.push(`- ${emoji} **${capitalize(highlight.category)}:** ${highlight.description}${participants}`);
  }
  lines.push("");

  // Quotes
  if (recap.quotes.length > 0) {
    lines.push("## Memorable Quotes");
    lines.push("");
    for (const quote of recap.quotes) {
      lines.push(`> "${quote.text}"`);
      lines.push(`> — *${quote.speaker}*${quote.context ? ` (${quote.context})` : ""}`);
      lines.push("");
    }
  }

  // Narrative
  lines.push("## Session Narrative");
  lines.push("");
  lines.push(recap.narrative);
  lines.push("");

  return lines.join("\n");
}

/**
 * Copy recap to clipboard as markdown
 */
export async function copyRecapToClipboard(recap: SessionRecap): Promise<void> {
  const markdown = recapToMarkdown(recap);
  await navigator.clipboard.writeText(markdown);
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    combat: "⚔️",
    roleplay: "🎭",
    discovery: "🔍",
    decision: "🤔",
    humor: "😂",
  };
  return emojis[category] ?? "📌";
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
