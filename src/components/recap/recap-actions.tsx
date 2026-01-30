import { useState } from "react";
import { Copy, FileDown, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyRecapToClipboard } from "@/lib/export/clipboard";
import { exportRecapToDocx } from "@/lib/export/docx-exporter";
import type { SessionRecap } from "@/types";

interface RecapActionsProps {
  recap: SessionRecap;
}

export function RecapActions({ recap }: RecapActionsProps) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleCopy = async () => {
    try {
      await copyRecapToClipboard(recap);
      setCopied(true);
      toast.success("Chronicle copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportRecapToDocx(recap);
      toast.success("Chronicle exported to DOCX");
    } catch (err) {
      console.error("Failed to export:", err);
      toast.error("Failed to export to DOCX");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        disabled={copied}
        className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy Markdown
          </>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={exporting}
        className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
      >
        <FileDown className="h-4 w-4" />
        {exporting ? "Exporting..." : "Export DOCX"}
      </Button>
    </div>
  );
}
