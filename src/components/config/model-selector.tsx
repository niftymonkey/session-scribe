import { Cpu, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModels } from "@/hooks/use-models";
import { formatContextLength, formatPrice, getDefaultModelId } from "@/lib/models/model-service";

interface ModelSelectorProps {
  value: string | undefined;
  onChange: (modelId: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const { models, isLoading, error } = useModels();

  const selectedModelId = value ?? getDefaultModelId();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-9 px-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading models...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Failed to load models. Using defaults.
      </div>
    );
  }

  const selectedModel = models.find((m) => m.modelId === selectedModelId);

  return (
    <div className="space-y-2">
      <Select value={selectedModelId} onValueChange={onChange}>
        <SelectTrigger className="w-full inset-field">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select a model" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.modelId}>
              <div className="flex items-center justify-between w-full gap-4">
                <span>{model.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatContextLength(model.contextLength)} context
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedModel && (
        <p className="text-xs text-muted-foreground">
          {formatContextLength(selectedModel.contextLength)} context window
          {" | "}
          {formatPrice(selectedModel.promptPrice)}/1M input
          {" | "}
          {formatPrice(selectedModel.completionPrice)}/1M output
        </p>
      )}
    </div>
  );
}
