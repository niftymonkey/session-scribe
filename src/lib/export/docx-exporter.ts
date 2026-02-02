import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
} from "docx";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import type { SessionRecap } from "@/types";

/**
 * Generate a DOCX document from a SessionRecap
 */
export function createRecapDocument(recap: SessionRecap): Document {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: recap.header.sessionTitle,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    })
  );

  // Metadata
  const metaLines: string[] = [];
  metaLines.push(`Date: ${recap.header.date.toLocaleDateString()}`);
  if (recap.header.missionName) {
    metaLines.push(`Mission: ${recap.header.missionName}`);
  }
  if (recap.header.bookNumber || recap.header.actNumber) {
    const bookAct = [
      recap.header.bookNumber && `Book ${recap.header.bookNumber}`,
      recap.header.actNumber && `Act ${recap.header.actNumber}`,
    ].filter(Boolean).join(", ");
    metaLines.push(bookAct);
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: metaLines.map((line, i) =>
        new TextRun({
          text: i > 0 ? ` | ${line}` : line,
          italics: true,
          size: 22,
        })
      ),
    })
  );

  children.push(new Paragraph({ text: "" }));

  // Attendance
  children.push(
    new Paragraph({
      text: "Attendance",
      heading: HeadingLevel.HEADING_1,
    })
  );

  const dm = recap.attendance.players.find(p => p.role === "dm");
  if (dm) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "DM: ", bold: true }),
          new TextRun({ text: dm.playerName }),
        ],
      })
    );
  }

  const players = recap.attendance.players.filter(p => p.role === "player");
  for (const player of players) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${player.playerName}: ` }),
          new TextRun({ text: player.characterName ?? "Unknown", italics: true }),
        ],
      })
    );
  }

  children.push(new Paragraph({ text: "" }));

  // Opening Context
  if (recap.openingContext) {
    children.push(
      new Paragraph({
        text: "Opening",
        heading: HeadingLevel.HEADING_1,
      })
    );

    children.push(
      new Paragraph({
        text: recap.openingContext.startingState,
        spacing: { after: 100 },
      })
    );

    if (recap.openingContext.objectives.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Objectives:", bold: true })],
        })
      );

      for (const objective of recap.openingContext.objectives) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            text: objective,
          })
        );
      }
    }

    children.push(new Paragraph({ text: "" }));
  }

  // Scene Highlights (exhaustive scene-by-scene breakdown)
  if (recap.sceneHighlights?.length > 0) {
    children.push(
      new Paragraph({
        text: "Session Events",
        heading: HeadingLevel.HEADING_1,
      })
    );

    for (const scene of recap.sceneHighlights) {
      // Scene heading
      children.push(
        new Paragraph({
          text: scene.sceneName,
          heading: HeadingLevel.HEADING_2,
        })
      );

      // Scene metadata
      const sceneMeta: string[] = [];
      if (scene.timeOfDay) sceneMeta.push(scene.timeOfDay);
      if (scene.charactersPresent.length > 0) {
        sceneMeta.push(`Characters: ${scene.charactersPresent.join(", ")}`);
      }
      if (sceneMeta.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: sceneMeta.join(" | "), italics: true, size: 20 })],
          })
        );
      }

      // Scene highlights with nested bullets
      for (const highlight of scene.highlights) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            text: highlight.text,
          })
        );

        if (highlight.subBullets && highlight.subBullets.length > 0) {
          for (const sub of highlight.subBullets) {
            children.push(
              new Paragraph({
                bullet: { level: 1 },
                text: sub,
              })
            );
          }
        }
      }

      children.push(new Paragraph({ text: "" }));
    }
  }

  // Key Highlights (categorized)
  children.push(
    new Paragraph({
      text: "Key Highlights",
      heading: HeadingLevel.HEADING_1,
    })
  );

  for (const highlight of recap.highlights) {
    const participants = highlight.participants?.length
      ? ` (${highlight.participants.join(", ")})`
      : "";

    children.push(
      new Paragraph({
        bullet: { level: 0 },
        children: [
          new TextRun({ text: `${capitalize(highlight.category)}: `, bold: true }),
          new TextRun({ text: highlight.description }),
          new TextRun({ text: participants, italics: true }),
        ],
      })
    );
  }

  children.push(new Paragraph({ text: "" }));

  // Quotes
  if (recap.quotes.length > 0) {
    children.push(
      new Paragraph({
        text: "Memorable Quotes",
        heading: HeadingLevel.HEADING_1,
      })
    );

    for (const quote of recap.quotes) {
      children.push(
        new Paragraph({
          indent: { left: 720 },
          children: [
            new TextRun({ text: `"${quote.text}"`, italics: true }),
          ],
        })
      );
      children.push(
        new Paragraph({
          indent: { left: 720 },
          children: [
            new TextRun({ text: `— ${quote.speaker}` }),
            quote.context ? new TextRun({ text: ` (${quote.context})`, italics: true }) : new TextRun({ text: "" }),
          ],
        })
      );
      children.push(new Paragraph({ text: "" }));
    }
  }

  // Narrative
  children.push(
    new Paragraph({
      text: "Session Narrative",
      heading: HeadingLevel.HEADING_1,
    })
  );

  // Split narrative into paragraphs
  const narrativeParagraphs = recap.narrative.split(/\n\n+/);
  for (const para of narrativeParagraphs) {
    children.push(
      new Paragraph({
        text: para.trim(),
        spacing: { after: 200 },
      })
    );
  }

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

/**
 * Export recap to DOCX file
 */
export async function exportRecapToDocx(recap: SessionRecap, filename?: string): Promise<void> {
  const doc = createRecapDocument(recap);
  const blob = await Packer.toBlob(doc);
  const buffer = await blob.arrayBuffer();

  // Get save path from user
  const defaultName = filename
    ? `${filename.replace(/[^a-zA-Z0-9\s-]/g, "_")}.docx`
    : `${recap.header.sessionTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Recap.docx`;
  const filePath = await save({
    defaultPath: defaultName,
    filters: [{ name: "Word Document", extensions: ["docx"] }],
  });

  if (!filePath) {
    return; // User cancelled
  }

  await writeFile(filePath, new Uint8Array(buffer));
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
