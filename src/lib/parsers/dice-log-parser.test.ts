import { describe, it, expect } from "vitest";
import { parseDiceLog, parseRollBlock, parseTurnMarker } from "./dice-log-parser";

describe("parseTurnMarker", () => {
  it("parses turn start marker", () => {
    const result = parseTurnMarker("Liam, it's now your turn!");
    expect(result).toEqual({ character: "Liam", round: undefined });
  });

  it("parses turn end marker", () => {
    const result = parseTurnMarker("Gorgrin's turn is done.");
    expect(result).toEqual({ character: "Gorgrin", round: undefined });
  });

  it("parses multi-word character names", () => {
    const result = parseTurnMarker("Kobold Warrior (1), it's now your turn!");
    expect(result).toEqual({ character: "Kobold Warrior (1)", round: undefined });
  });

  it("returns null for non-turn markers", () => {
    expect(parseTurnMarker("Some random text")).toBeNull();
    expect(parseTurnMarker("Perception Check")).toBeNull();
  });
});

describe("parseRollBlock", () => {
  it("parses a simple roll block", () => {
    const block = `Liam AC:15 PP:15 DC:13:
Liam Alderpath
Perception Check
20
Details`;
    const result = parseRollBlock(block);
    expect(result).not.toBeNull();
    expect(result?.character).toBe("Liam Alderpath");
    expect(result?.rollType).toBe("Perception Check");
    expect(result?.result).toBe(20);
  });

  it("parses rolls with multiple results (takes first)", () => {
    const block = `Gorgrin, AC: 15, PP: 10:
Gorgrin Snowstep
Dexterity Saving Throw
20
17
Details`;
    const result = parseRollBlock(block);
    expect(result).not.toBeNull();
    expect(result?.character).toBe("Gorgrin Snowstep");
    expect(result?.rollType).toBe("Dexterity Saving Throw");
    expect(result?.result).toBe(20);
  });

  it("parses GM rolls", () => {
    const block = `Storyteller (GM):rolling 1d8
(
1
)
=1`;
    const result = parseRollBlock(block);
    expect(result).not.toBeNull();
    expect(result?.character).toBe("Storyteller (GM)");
    expect(result?.result).toBe(1);
  });

  it("returns null for non-roll blocks", () => {
    expect(parseRollBlock("Random text")).toBeNull();
    expect(parseRollBlock("")).toBeNull();
  });
});

describe("parseDiceLog", () => {
  const sampleDiceLog = `Liam AC:15 PP:15 DC:13:
Liam Alderpath
Perception Check
20
Details
:
Sam's turn is done.
Liam, it's now your turn!
⏪ POTEOT ⏩
Aurelion AC:17 PP:13 DC:13:
Aurelion Lightward
Intimidation Check
19
Details`;

  it("extracts dice roll entries", () => {
    const result = parseDiceLog(sampleDiceLog);
    const rolls = result.entries.filter(e => e.type === "roll");
    expect(rolls.length).toBeGreaterThan(0);
  });

  it("extracts turn markers", () => {
    const result = parseDiceLog(sampleDiceLog);
    const turns = result.entries.filter(e => e.type === "turn");
    expect(turns.length).toBeGreaterThan(0);
  });

  it("extracts unique characters", () => {
    const result = parseDiceLog(sampleDiceLog);
    expect(result.characters).toContain("Liam Alderpath");
    expect(result.characters).toContain("Aurelion Lightward");
  });

  it("counts total rolls", () => {
    const result = parseDiceLog(sampleDiceLog);
    expect(result.rollCount).toBeGreaterThan(0);
  });

  it("handles empty input", () => {
    const result = parseDiceLog("");
    expect(result.entries).toEqual([]);
    expect(result.characters).toEqual([]);
    expect(result.rollCount).toBe(0);
  });
});
