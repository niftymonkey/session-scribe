import { useState, useEffect } from "react";
import { Settings, Eye, EyeOff, Key, Map, Users, Cpu } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PlayerConfigEditor } from "./player-config-editor";
import { ModelSelector } from "./model-selector";
import type { AppConfig, CampaignInfo, PlayerConfig } from "@/types";

interface SettingsDialogProps {
  config: AppConfig;
  onSave: (updates: {
    apiKey?: string;
    campaign?: Partial<CampaignInfo>;
    players?: PlayerConfig[];
    selectedModel?: string;
  }) => Promise<void>;
  detectedSpeakers?: string[];
}

export function SettingsDialog({
  config,
  onSave,
  detectedSpeakers,
}: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState(config.openaiApiKey);
  const [campaignName, setCampaignName] = useState(config.campaign.name);
  const [currentBook, setCurrentBook] = useState(
    config.campaign.currentBook?.toString() ?? ""
  );
  const [currentAct, setCurrentAct] = useState(
    config.campaign.currentAct?.toString() ?? ""
  );
  const [players, setPlayers] = useState(config.players);
  const [selectedModel, setSelectedModel] = useState(config.selectedModel);
  const [isSaving, setIsSaving] = useState(false);

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      setApiKey(config.openaiApiKey);
      setCampaignName(config.campaign.name);
      setCurrentBook(config.campaign.currentBook?.toString() ?? "");
      setCurrentAct(config.campaign.currentAct?.toString() ?? "");
      setPlayers(config.players);
      setSelectedModel(config.selectedModel);
    }
  }, [open, config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        apiKey,
        campaign: {
          name: campaignName,
          currentBook: currentBook ? parseInt(currentBook) : undefined,
          currentAct: currentAct ? parseInt(currentAct) : undefined,
        },
        players,
        selectedModel,
      });
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto surface-card border-border/50">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl" style={{ fontFamily: 'var(--font-display)' }}>
            Chronicle Settings
          </DialogTitle>
          <DialogDescription>
            Configure your API key, campaign details, and adventuring party.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* API Key Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <Key className="h-4 w-4" />
              <h3 className="text-sm font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                API Configuration
              </h3>
            </div>
            <div className="space-y-2 pl-6">
              <Label htmlFor="api-key" className="text-sm">OpenAI API Key</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10 inset-field"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent hover:text-accent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your key is stored locally and only sent to OpenAI for generation.
              </p>
            </div>
          </section>

          <Separator className="bg-border/40" />

          {/* Model Selection Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <Cpu className="h-4 w-4" />
              <h3 className="text-sm font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                AI Model
              </h3>
            </div>
            <div className="space-y-2 pl-6">
              <Label className="text-sm">Model</Label>
              <ModelSelector
                value={selectedModel}
                onChange={setSelectedModel}
              />
            </div>
          </section>

          <Separator className="bg-border/40" />

          {/* Campaign Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <Map className="h-4 w-4" />
              <h3 className="text-sm font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                Campaign Details
              </h3>
            </div>
            <div className="flex gap-4 pl-6">
              <div className="flex-1 min-w-0">
                <Label htmlFor="campaign-name" className="text-xs text-muted-foreground">
                  Campaign Name
                </Label>
                <Input
                  id="campaign-name"
                  placeholder="The Lost Mines of Phandelver"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="inset-field"
                />
              </div>
              <div className="w-20">
                <Label htmlFor="current-book" className="text-xs text-muted-foreground">
                  Book
                </Label>
                <Input
                  id="current-book"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={currentBook}
                  onChange={(e) => setCurrentBook(e.target.value)}
                  className="inset-field"
                />
              </div>
              <div className="w-20">
                <Label htmlFor="current-act" className="text-xs text-muted-foreground">
                  Act
                </Label>
                <Input
                  id="current-act"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={currentAct}
                  onChange={(e) => setCurrentAct(e.target.value)}
                  className="inset-field"
                />
              </div>
            </div>
          </section>

          <Separator className="bg-border/40" />

          {/* Player Roster Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <Users className="h-4 w-4" />
              <h3 className="text-sm font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                Adventuring Party
              </h3>
            </div>
            <div className="pl-6">
              <PlayerConfigEditor
                players={players}
                onPlayersChange={setPlayers}
                detectedSpeakers={detectedSpeakers}
              />
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="hover:bg-secondary/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="min-w-24"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
