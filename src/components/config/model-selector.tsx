import { useState } from "react";
import { Cpu, Loader2, Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useModels } from "@/hooks/use-models";
import type { ParsedModel } from "@/types";
import { formatContextLength, formatPrice, getDefaultModelId } from "@/lib/models/model-service";

const HIGH_CONTEXT_THRESHOLD = 400_000;
const EXPENSIVE_THRESHOLD = 10; // $10/1M tokens

interface ModelSelectorProps {
  value: string | undefined;
  onChange: (modelId: string) => void;
}

function ModelItemInfo({ model }: { model: ParsedModel }) {
  return (
    <span className="text-xs text-muted-foreground">
      — {formatContextLength(model.contextLength)} | {formatPrice(model.promptPrice)}/{formatPrice(model.completionPrice)} per 1M tokens
    </span>
  );
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const { models, isLoading, error } = useModels();
  const [showOnlyHighContext, setShowOnlyHighContext] = useState(true);

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

  const filteredModels = showOnlyHighContext
    ? models.filter((m) => m.contextLength >= HIGH_CONTEXT_THRESHOLD)
    : models;

  const recommendedModels = filteredModels.filter((m) => m.isRecommended);
  const otherModels = filteredModels.filter((m) => !m.isRecommended);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Select value={selectedModelId} onValueChange={onChange}>
        <SelectTrigger className="flex-1 inset-field">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select a model" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {recommendedModels.length > 0 && (
            <>
              <SelectGroup>
                <SelectLabel className="flex items-center gap-1.5 text-primary">
                  <Star className="h-3 w-3 fill-primary" />
                  Recommended
                </SelectLabel>
                {recommendedModels.map((model) => (
                  <SelectItem key={model.id} value={model.modelId} className="pl-5">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-2">
                        {model.name}
                        {model.promptPrice >= EXPENSIVE_THRESHOLD && (
                          <span className="text-xs text-amber-500" title="Expensive">$$</span>
                        )}
                      </span>
                      <ModelItemInfo model={model} />
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
            </>
          )}
          <SelectGroup>
            <SelectLabel className="text-muted-foreground font-normal">All Models</SelectLabel>
            {otherModels.map((model) => (
              <SelectItem key={model.id} value={model.modelId} className="pl-5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-2">
                    {model.name}
                    {model.promptPrice >= EXPENSIVE_THRESHOLD && (
                      <span className="text-xs text-amber-500" title="Expensive">$$</span>
                    )}
                  </span>
                  <ModelItemInfo model={model} />
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

        <div className="flex shrink-0 items-center gap-2">
          <Checkbox
            id="high-context-filter"
            checked={showOnlyHighContext}
            onCheckedChange={(checked) => setShowOnlyHighContext(checked === true)}
          />
          <Label
            htmlFor="high-context-filter"
            className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap"
          >
            400K+ only
          </Label>
        </div>
      </div>
    </div>
  );
}
