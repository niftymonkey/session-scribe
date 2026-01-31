import { describe, it, expect } from "vitest";
import { normalizeTranscript } from "./normalize";
import type { TranscriptData, PlayerConfig, NPCConfig } from "@/types";

describe("normalizeTranscript", () => {
  const baseTranscript: TranscriptData = {
    metadata: {
      title: "Test Session",
      date: new Date(),
      duration: "1:00:00",
      durationSeconds: 3600,
    },
    entries: [],
    speakers: [],
  };

  describe("speaker normalization", () => {
    it("normalizes speaker names using player aliases", () => {
      const transcript: TranscriptData = {
        ...baseTranscript,
        entries: [
          { speaker: "Mike", timestamp: "0:00", timestampSeconds: 0, text: "Hello" },
          { speaker: "Mikael", timestamp: "0:05", timestampSeconds: 5, text: "Hi there" },
          { speaker: "Michael", timestamp: "0:10", timestampSeconds: 10, text: "Hey" },
        ],
        speakers: ["Mike", "Mikael", "Michael"],
      };

      const players: PlayerConfig[] = [
        { playerName: "Michael", characterName: "Aurelion", role: "player", aliases: ["Mike", "Mikael"] },
      ];

      const result = normalizeTranscript(transcript, players, []);

      expect(result.transcript.entries[0].speaker).toBe("Michael");
      expect(result.transcript.entries[1].speaker).toBe("Michael");
      expect(result.transcript.entries[2].speaker).toBe("Michael");
      expect(result.transcript.speakers).toEqual(["Michael"]);
      expect(result.appliedMappings.speakers.get("Mike")).toBe("Michael");
      expect(result.appliedMappings.speakers.get("Mikael")).toBe("Michael");
    });

    it("is case-insensitive for speaker matching", () => {
      const transcript: TranscriptData = {
        ...baseTranscript,
        entries: [
          { speaker: "MIKE", timestamp: "0:00", timestampSeconds: 0, text: "Hello" },
        ],
        speakers: ["MIKE"],
      };

      const players: PlayerConfig[] = [
        { playerName: "Michael", characterName: "Aurelion", role: "player", aliases: ["mike"] },
      ];

      const result = normalizeTranscript(transcript, players, []);

      expect(result.transcript.entries[0].speaker).toBe("Michael");
    });
  });

  describe("NPC name normalization", () => {
    it("replaces NPC aliases in text content", () => {
      const transcript: TranscriptData = {
        ...baseTranscript,
        entries: [
          { speaker: "DM", timestamp: "0:00", timestampSeconds: 0, text: "Preanella walks into the room." },
          { speaker: "DM", timestamp: "0:05", timestampSeconds: 5, text: "The Princess greets you warmly." },
        ],
        speakers: ["DM"],
      };

      const npcs: NPCConfig[] = [
        { name: "Princess Priyanella", aliases: ["Preanella", "Pritenella", "Princess"] },
      ];

      const result = normalizeTranscript(transcript, [], npcs);

      expect(result.transcript.entries[0].text).toBe("Princess Priyanella walks into the room.");
      expect(result.transcript.entries[1].text).toBe("The Princess Priyanella greets you warmly.");
    });

    it("handles word boundaries correctly", () => {
      const transcript: TranscriptData = {
        ...baseTranscript,
        entries: [
          { speaker: "DM", timestamp: "0:00", timestampSeconds: 0, text: "Tomás is here, not Tommy." },
        ],
        speakers: ["DM"],
      };

      const npcs: NPCConfig[] = [
        { name: "Thomas", aliases: ["Tom"] },
      ];

      const result = normalizeTranscript(transcript, [], npcs);

      // "Tom" should NOT match "Tomás" or "Tommy" due to word boundaries
      expect(result.transcript.entries[0].text).toBe("Tomás is here, not Tommy.");
    });

    it("is case-insensitive for NPC matching", () => {
      const transcript: TranscriptData = {
        ...baseTranscript,
        entries: [
          { speaker: "DM", timestamp: "0:00", timestampSeconds: 0, text: "PREANELLA is angry." },
        ],
        speakers: ["DM"],
      };

      const npcs: NPCConfig[] = [
        { name: "Princess Priyanella", aliases: ["Preanella"] },
      ];

      const result = normalizeTranscript(transcript, [], npcs);

      expect(result.transcript.entries[0].text).toBe("Princess Priyanella is angry.");
    });
  });

  describe("combined normalization", () => {
    it("normalizes both speakers and NPC names", () => {
      const transcript: TranscriptData = {
        ...baseTranscript,
        entries: [
          { speaker: "Mike", timestamp: "0:00", timestampSeconds: 0, text: "I talk to Preanella." },
        ],
        speakers: ["Mike"],
      };

      const players: PlayerConfig[] = [
        { playerName: "Michael", characterName: "Aurelion", role: "player", aliases: ["Mike"] },
      ];

      const npcs: NPCConfig[] = [
        { name: "Princess Priyanella", aliases: ["Preanella"] },
      ];

      const result = normalizeTranscript(transcript, players, npcs);

      expect(result.transcript.entries[0].speaker).toBe("Michael");
      expect(result.transcript.entries[0].text).toBe("I talk to Princess Priyanella.");
    });
  });
});
