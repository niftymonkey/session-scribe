import { useRef, useEffect, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Lock, Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Phase, PhaseStatus } from "@/types";
import { getPhaseTitle, getPhaseNumber } from "@/types";

interface PhaseContainerProps {
  phase: Phase;
  status: PhaseStatus;
  title?: string;
  summary?: ReactNode;
  children: ReactNode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  scrollIntoView?: boolean;
}

export function PhaseContainer({
  phase,
  status,
  title,
  summary,
  children,
  isExpanded,
  onToggleExpand,
  scrollIntoView = false,
}: PhaseContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayTitle = title ?? getPhaseTitle(phase);
  const phaseNumber = getPhaseNumber(phase);

  // Scroll into view when becoming active
  useEffect(() => {
    if (scrollIntoView && status === "active" && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [scrollIntoView, status]);

  const StatusIcon = getStatusIcon(status);
  const canExpand = status === "complete" || status === "active";

  return (
    <div
      ref={containerRef}
      className={cn(
        "phase-container transition-all duration-500 ease-out scroll-mt-24",
        status === "locked" && "phase-locked",
        status === "available" && "phase-available",
        status === "active" && "phase-active",
        status === "complete" && "phase-complete"
      )}
    >
      {/* Phase Header - Always visible */}
      <button
        type="button"
        onClick={canExpand ? onToggleExpand : undefined}
        disabled={!canExpand}
        className={cn(
          "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
          "surface-card",
          canExpand && "cursor-pointer hover-lift",
          !canExpand && "cursor-default opacity-60"
        )}
      >
        {/* Phase Number Badge */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border",
            "transition-all duration-300",
            status === "locked" && "bg-muted/20 text-muted-foreground/50 border-transparent",
            status === "available" && "bg-primary/10 text-primary/70 border-primary/20",
            status === "active" && "bg-primary/15 text-primary border-primary/40",
            status === "complete" && "bg-success/15 text-success border-success/30"
          )}
        >
          <StatusIcon className="w-5 h-5" />
        </div>

        {/* Title and Summary */}
        <div className="flex-grow text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60 font-medium">
              Phase {phaseNumber}
            </span>
            {status === "active" && (
              <span className="text-xs bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                Current
              </span>
            )}
          </div>
          <h2
            className={cn(
              "text-lg font-semibold tracking-tight truncate",
              status === "locked" && "text-muted-foreground/50",
              status === "available" && "text-foreground/70",
              status === "active" && "text-foreground",
              status === "complete" && "text-foreground/80"
            )}
          >
            {displayTitle}
          </h2>
          {!isExpanded && summary && (
            <div className="text-sm text-muted-foreground/70 truncate mt-1">
              {summary}
            </div>
          )}
        </div>

        {/* Expand/Collapse Indicator */}
        {canExpand && (
          <div className="flex-shrink-0 text-muted-foreground/50">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        )}
      </button>

      {/* Phase Content - Collapsible */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-out",
          isExpanded ? "max-h-[5000px] opacity-100 mt-4" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-2">{children}</div>
      </div>
    </div>
  );
}

function getStatusIcon(status: PhaseStatus) {
  switch (status) {
    case "locked":
      return Lock;
    case "available":
      return Circle;
    case "active":
      return Loader2;
    case "complete":
      return Check;
  }
}
