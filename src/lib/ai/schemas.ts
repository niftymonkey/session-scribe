import { z } from "zod";

// Pass 1: Scene Discovery + NPC Detection
export const Pass1Schema = z.object({
  scenes: z.array(
    z.object({
      name: z.string(),
      startTimestampSeconds: z.number(),
      endTimestampSeconds: z.number(),
      location: z.string(),
      characters: z.array(z.string()),
    })
  ),
  npcs: z.array(
    z.object({
      canonicalName: z.string().describe("The correct/canonical name for this NPC"),
      variations: z.array(z.string()).describe("Other names/spellings heard in the transcript for this same NPC"),
    })
  ),
});

// Pass 2: Scene Details (per scene)
export const Pass2Schema = z.object({
  sceneName: z.string(),
  charactersPresent: z.array(z.string()),
  timeOfDay: z.string().nullable(),
  events: z.array(
    z.object({
      description: z.string(),
      character: z.string().nullable(),
      items: z.array(z.string()),
      goldAmounts: z.array(z.string()),
    })
  ),
  quotes: z.array(
    z.object({
      speaker: z.string(),
      text: z.string(),
      context: z.string().nullable(),
    })
  ),
  enemies: z.array(z.string()),
});

// Pass 3: Synthesis (final recap structure)
export const Pass3Schema = z.object({
  scenes: z.array(
    z.object({
      name: z.string(),
      characters: z.array(z.string()),
      locations: z.array(z.string()),
      enemies: z.array(z.string()),
    })
  ),
  openingContext: z.object({
    startingState: z.string(),
    objectives: z.array(z.string()),
  }),
  sceneHighlights: z.array(
    z.object({
      sceneName: z.string(),
      charactersPresent: z.array(z.string()),
      timeOfDay: z.string().nullable(),
      highlights: z.array(
        z.object({
          text: z.string(),
          subBullets: z.array(z.string()),
        })
      ),
    })
  ),
  highlights: z.array(
    z.object({
      category: z.enum(["combat", "roleplay", "discovery", "decision", "humor"]),
      description: z.string(),
      participants: z.array(z.string()).nullable(),
    })
  ),
  quotes: z.array(
    z.object({
      speaker: z.string(),
      text: z.string(),
      context: z.string().nullable(),
    })
  ),
  narrative: z.string(),
});

export type Pass1Result = z.infer<typeof Pass1Schema>;
export type Pass2Result = z.infer<typeof Pass2Schema>;
export type Pass3Result = z.infer<typeof Pass3Schema>;
