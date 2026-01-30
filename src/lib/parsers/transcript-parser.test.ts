import { describe, it, expect } from "vitest";
import { parseTranscript, parseTimestamp, parseDuration } from "./transcript-parser";

describe("parseTimestamp", () => {
  it("parses simple minute:second format", () => {
    expect(parseTimestamp("0:04")).toBe(4);
    expect(parseTimestamp("2:03")).toBe(123);
    expect(parseTimestamp("4:06")).toBe(246);
  });

  it("parses hour:minute:second format", () => {
    expect(parseTimestamp("1:30:00")).toBe(5400);
    expect(parseTimestamp("2:14:58")).toBe(8098);
  });

  it("returns 0 for invalid timestamps", () => {
    expect(parseTimestamp("invalid")).toBe(0);
    expect(parseTimestamp("")).toBe(0);
  });
});

describe("parseDuration", () => {
  it("parses duration with hours, minutes, and seconds", () => {
    expect(parseDuration("2h 14m 58s")).toBe(8098);
  });

  it("parses duration with only minutes and seconds", () => {
    expect(parseDuration("45m 30s")).toBe(2730);
  });

  it("parses duration with only hours and minutes", () => {
    expect(parseDuration("1h 30m")).toBe(5400);
  });

  it("returns 0 for invalid durations", () => {
    expect(parseDuration("invalid")).toBe(0);
  });
});

describe("parseTranscript", () => {
  const sampleTranscript = `1-3-41 Mind Your Mannerisms (part5)-20260112_195840-Meeting Recording
January 12, 2026, 1:58AM
2h 14m 58s

Micco Fay started transcription

Micco Fay   0:04
All right, welcome to Book One, Act 3, Session 41 of the World Campaign story.

Samuel Frost   2:03
OK.

Micco Fay   2:20
Chosen some conversation there.
Tom had a little sweet moment.`;

  it("extracts metadata from header", () => {
    const result = parseTranscript(sampleTranscript);
    expect(result.metadata.title).toBe("1-3-41 Mind Your Mannerisms (part5)-20260112_195840-Meeting Recording");
    expect(result.metadata.duration).toBe("2h 14m 58s");
    expect(result.metadata.durationSeconds).toBe(8098);
  });

  it("parses the date correctly", () => {
    const result = parseTranscript(sampleTranscript);
    expect(result.metadata.date.getFullYear()).toBe(2026);
    expect(result.metadata.date.getMonth()).toBe(0); // January is 0
    expect(result.metadata.date.getDate()).toBe(12);
  });

  it("extracts transcript entries", () => {
    const result = parseTranscript(sampleTranscript);
    expect(result.entries.length).toBe(3);
  });

  it("parses entry speakers correctly", () => {
    const result = parseTranscript(sampleTranscript);
    expect(result.entries[0].speaker).toBe("Micco Fay");
    expect(result.entries[1].speaker).toBe("Samuel Frost");
    expect(result.entries[2].speaker).toBe("Micco Fay");
  });

  it("parses entry timestamps correctly", () => {
    const result = parseTranscript(sampleTranscript);
    expect(result.entries[0].timestamp).toBe("0:04");
    expect(result.entries[0].timestampSeconds).toBe(4);
    expect(result.entries[1].timestamp).toBe("2:03");
    expect(result.entries[1].timestampSeconds).toBe(123);
  });

  it("parses entry text correctly, including multi-line entries", () => {
    const result = parseTranscript(sampleTranscript);
    expect(result.entries[0].text).toBe("All right, welcome to Book One, Act 3, Session 41 of the World Campaign story.");
    expect(result.entries[2].text).toBe("Chosen some conversation there.\nTom had a little sweet moment.");
  });

  it("extracts unique speakers", () => {
    const result = parseTranscript(sampleTranscript);
    expect(result.speakers).toContain("Micco Fay");
    expect(result.speakers).toContain("Samuel Frost");
    expect(result.speakers.length).toBe(2);
  });

  it("handles empty input", () => {
    const result = parseTranscript("");
    expect(result.entries).toEqual([]);
    expect(result.speakers).toEqual([]);
  });
});
