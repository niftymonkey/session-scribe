import type { TranscriptData, TranscriptEntry, TranscriptMetadata } from "@/types";

/**
 * Parse a timestamp string like "0:04", "2:03", or "1:30:00" to seconds
 */
export function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(":").map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 2) {
    // mm:ss
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // hh:mm:ss
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Parse a duration string like "2h 14m 58s" to seconds
 */
export function parseDuration(duration: string): number {
  let totalSeconds = 0;

  const hoursMatch = duration.match(/(\d+)h/);
  const minutesMatch = duration.match(/(\d+)m/);
  const secondsMatch = duration.match(/(\d+)s/);

  if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;
  if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;
  if (secondsMatch) totalSeconds += parseInt(secondsMatch[1]);

  return totalSeconds;
}

/**
 * Parse a date string like "January 12, 2026, 1:58AM" to a Date object
 */
function parseDate(dateString: string): Date {
  // Remove trailing time portion if present and parse
  // "January 12, 2026, 1:58AM" -> "January 12, 2026"
  const cleaned = dateString.replace(/,\s*\d+:\d+[AP]M$/i, "");
  return new Date(cleaned);
}

/**
 * Check if a line is a speaker line (contains speaker name and timestamp)
 * Format: "Speaker Name   M:SS" or "Speaker Name   H:MM:SS"
 * Also handles inline text: "Speaker Name   M:SSText continues here"
 */
function parseSpeakerLine(line: string): { speaker: string; timestamp: string; inlineText?: string } | null {
  // First try: timestamp at end of line (standard format)
  const endMatch = line.match(/^(.+?)\s{2,}(\d+:\d+(?::\d+)?)\s*$/);
  if (endMatch) {
    return {
      speaker: endMatch[1].trim(),
      timestamp: endMatch[2],
    };
  }

  // Second try: timestamp followed by text on same line (DOCX format variant)
  const inlineMatch = line.match(/^(.+?)\s{2,}(\d+:\d+(?::\d+)?)([A-Z].*)$/);
  if (inlineMatch) {
    return {
      speaker: inlineMatch[1].trim(),
      timestamp: inlineMatch[2],
      inlineText: inlineMatch[3],
    };
  }

  return null;
}

/**
 * Parse a Teams transcript into structured data
 */
export function parseTranscript(content: string): TranscriptData {
  if (!content.trim()) {
    return {
      metadata: {
        title: "",
        date: new Date(),
        duration: "",
        durationSeconds: 0,
      },
      entries: [],
      speakers: [],
    };
  }

  const lines = content.split("\n");

  // Parse header (first 3 lines)
  const title = lines[0]?.trim() || "";
  const dateStr = lines[1]?.trim() || "";
  const durationStr = lines[2]?.trim() || "";

  const metadata: TranscriptMetadata = {
    title,
    date: parseDate(dateStr),
    duration: durationStr,
    durationSeconds: parseDuration(durationStr),
  };

  const entries: TranscriptEntry[] = [];
  const speakersSet = new Set<string>();

  let currentEntry: TranscriptEntry | null = null;
  let textLines: string[] = [];

  // Skip header lines and empty lines, start parsing entries
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];

    // Skip "X started transcription" lines
    if (line.includes("started transcription")) {
      continue;
    }

    const speakerInfo = parseSpeakerLine(line);

    if (speakerInfo) {
      // Save previous entry if exists
      if (currentEntry) {
        currentEntry.text = textLines.join("\n").trim();
        if (currentEntry.text) {
          entries.push(currentEntry);
        }
      }

      // Start new entry
      currentEntry = {
        speaker: speakerInfo.speaker,
        timestamp: speakerInfo.timestamp,
        timestampSeconds: parseTimestamp(speakerInfo.timestamp),
        text: "",
      };
      speakersSet.add(speakerInfo.speaker);
      // If there's inline text after the timestamp, use it as the first line
      textLines = speakerInfo.inlineText ? [speakerInfo.inlineText] : [];
    } else if (currentEntry && line.trim()) {
      // Add text line to current entry
      textLines.push(line.trim());
    }
  }

  // Don't forget the last entry
  if (currentEntry) {
    currentEntry.text = textLines.join("\n").trim();
    if (currentEntry.text) {
      entries.push(currentEntry);
    }
  }

  return {
    metadata,
    entries,
    speakers: Array.from(speakersSet),
  };
}
