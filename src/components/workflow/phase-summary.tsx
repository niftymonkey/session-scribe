import { FileText, Users, Sparkles, Clock, Dices, Link2, UserCheck } from "lucide-react";
import type { ImportPhaseSummary, ParseReviewSummary, GeneratePhaseSummary } from "@/types";

interface ImportSummaryProps {
  data: ImportPhaseSummary;
}

export function ImportPhaseSummaryDisplay({ data }: ImportSummaryProps) {
  const parts: string[] = [];

  if (data.sessionTitle) {
    parts.push(data.sessionTitle);
  }
  if (data.date) {
    parts.push(data.date);
  }
  if (data.duration) {
    parts.push(data.duration);
  }
  parts.push(`${data.entryCount} entries`);

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5 text-primary/70" />
        <span>{parts.join(" - ")}</span>
      </div>
      {data.hasDiceLog && (
        <div className="flex items-center gap-1.5 text-muted-foreground/60">
          <Dices className="w-3.5 h-3.5" />
          <span>+ Dice log ({data.diceLogRollCount} rolls)</span>
        </div>
      )}
    </div>
  );
}

interface ParseReviewSummaryProps {
  data: ParseReviewSummary;
}

export function ParseReviewSummaryDisplay({ data }: ParseReviewSummaryProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5 text-primary/70" />
        <span>
          {data.playerCount} player{data.playerCount !== 1 ? "s" : ""} configured
          {data.dmCount > 0 && ` (${data.dmCount} DM)`}
        </span>
      </div>
      {data.savedNpcCount > 0 && (
        <div className="flex items-center gap-1.5 text-muted-foreground/60">
          <UserCheck className="w-3.5 h-3.5" />
          <span>{data.savedNpcCount} saved NPC{data.savedNpcCount !== 1 ? "s" : ""}</span>
        </div>
      )}
      {data.matchedCount > 0 && (
        <div className="flex items-center gap-1.5 text-success/70">
          <Link2 className="w-3.5 h-3.5" />
          <span>{data.matchedCount} matched</span>
        </div>
      )}
    </div>
  );
}

interface GenerateSummaryProps {
  data: GeneratePhaseSummary;
}

export function GeneratePhaseSummaryDisplay({ data }: GenerateSummaryProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-primary/70" />
        <span>Generated in {data.elapsedTime}</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground/60">
        <Sparkles className="w-3.5 h-3.5" />
        <span>
          {data.sceneCount} scene{data.sceneCount !== 1 ? "s" : ""}, {" "}
          {data.highlightCount} highlight{data.highlightCount !== 1 ? "s" : ""}, {" "}
          {data.quoteCount} quote{data.quoteCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
