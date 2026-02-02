/**
 * Phase-based workflow types for the UX redesign
 */

export type Phase = "import" | "parse-review" | "generate" | "output";

export type PhaseStatus = "locked" | "available" | "active" | "complete";

export interface PhaseState {
  current: Phase;
  completed: Phase[];
  expanded: Phase[]; // Phases currently expanded (allows reviewing completed phases)
}

export interface PhaseSummaryData {
  import: ImportPhaseSummary | null;
  "parse-review": ParseReviewSummary | null;
  generate: GeneratePhaseSummary | null;
  output: null; // Output phase doesn't collapse
}

export interface ImportPhaseSummary {
  sessionTitle?: string;
  date?: string;
  duration?: string;
  entryCount: number;
  hasDiceLog: boolean;
  diceLogRollCount?: number;
}

export interface ParseReviewSummary {
  playerCount: number;
  dmCount: number;
  savedNpcCount: number;
  matchedCount: number;
}

export interface GeneratePhaseSummary {
  elapsedTime: string;
  sceneCount: number;
  highlightCount: number;
  quoteCount: number;
}

export interface PhaseTransitions {
  canAdvanceTo: (phase: Phase) => boolean;
  advance: (phase: Phase) => void;
  expand: (phase: Phase) => void;
  collapse: (phase: Phase) => void;
  toggleExpand: (phase: Phase) => void;
}

/**
 * Get the display title for a phase
 */
export function getPhaseTitle(phase: Phase): string {
  switch (phase) {
    case "import":
      return "Import Session Files";
    case "parse-review":
      return "Review & Configure";
    case "generate":
      return "Generate Chronicle";
    case "output":
      return "Session Recap";
  }
}

/**
 * Get the phase number for display
 */
export function getPhaseNumber(phase: Phase): number {
  const phases: Phase[] = ["import", "parse-review", "generate", "output"];
  return phases.indexOf(phase) + 1;
}

/**
 * Get all phases in order
 */
export function getAllPhases(): Phase[] {
  return ["import", "parse-review", "generate", "output"];
}

/**
 * Check if a phase comes before another
 */
export function isPhaseBefore(phase: Phase, other: Phase): boolean {
  return getPhaseNumber(phase) < getPhaseNumber(other);
}

/**
 * Check if a phase comes after another
 */
export function isPhaseAfter(phase: Phase, other: Phase): boolean {
  return getPhaseNumber(phase) > getPhaseNumber(other);
}
