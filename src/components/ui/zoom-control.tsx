import { Minus, Plus } from "lucide-react";
import { Button } from "./button";

interface ZoomControlProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

export function ZoomControl({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  canZoomIn,
  canZoomOut,
}: ZoomControlProps) {
  const percentage = Math.round(zoom * 100);
  const isDefault = percentage === 100;

  return (
    <div className="flex items-center border border-input rounded-md">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-8 rounded-none rounded-l-md hover:bg-secondary/50"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        title="Zoom out (Ctrl+-)"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <button
        type="button"
        onClick={onReset}
        disabled={isDefault}
        className="h-9 px-2 text-xs font-mono tabular-nums min-w-[3.5rem] hover:bg-secondary/50 disabled:opacity-50 disabled:cursor-default transition-colors"
        title={isDefault ? "100%" : "Reset to 100% (Ctrl+0)"}
      >
        {percentage}%
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-8 rounded-none rounded-r-md hover:bg-secondary/50"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        title="Zoom in (Ctrl++)"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
