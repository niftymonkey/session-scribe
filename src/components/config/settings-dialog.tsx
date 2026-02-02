import { useState, useEffect } from "react";
import { Settings, Eye, EyeOff, Key, Map, Users, Cpu, Sparkles, UserCircle, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlayerConfigEditor } from "./player-config-editor";
import { NPCConfigEditor } from "./npc-config-editor";
import { ModelSelector } from "./model-selector";
import type { AppConfig, CampaignInfo, PlayerConfig, NPCConfig, DetectedNPC } from "@/types";

interface SettingsDialogProps {
  config: AppConfig;
  onSave: (updates: {
    apiKey?: string;
    campaign?: Partial<CampaignInfo>;
    players?: PlayerConfig[];
    npcs?: NPCConfig[];
    selectedModel?: string;
  }) => Promise<void>;
  detectedSpeakers?: string[];
  detectedNPCs?: DetectedNPC[];
}

export function SettingsDialog({
  config,
  onSave,
  detectedSpeakers,
  detectedNPCs,
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
  const [npcs, setNpcs] = useState(config.npcs);
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
      setNpcs(config.npcs);
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
        npcs,
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
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] h-[80vh] max-h-[800px] flex flex-col p-0 gap-0 surface-card border-border/50">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
          <DialogTitle className="text-xl" style={{ fontFamily: 'var(--font-display)' }}>
            Chronicle Settings
          </DialogTitle>
          <DialogDescription>
            Configure your campaign, AI settings, and adventuring party.
          </DialogDescription>
        </DialogHeader>

        {/* Tabbed Content */}
        <Tabs defaultValue="campaign" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 grid grid-cols-4 bg-secondary/30 shrink-0">
            <TabsTrigger value="campaign" className="gap-2 data-[state=active]:bg-card">
              <Map className="h-3.5 w-3.5" />
              Campaign
            </TabsTrigger>
            <TabsTrigger value="party" className="gap-2 data-[state=active]:bg-card">
              <Users className="h-3.5 w-3.5" />
              Party
            </TabsTrigger>
            <TabsTrigger value="npcs" className="gap-2 data-[state=active]:bg-card">
              <UserCircle className="h-3.5 w-3.5" />
              NPCs
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2 data-[state=active]:bg-card">
              <Sparkles className="h-3.5 w-3.5" />
              AI
            </TabsTrigger>
          </TabsList>

          {/* Campaign Tab */}
          <TabsContent value="campaign" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <Map className="h-4 w-4 text-accent" />
                    Campaign Details
                  </h3>
                  <div className="space-y-4 pl-6">
                    <div>
                      <Label htmlFor="campaign-name" className="text-sm">
                        Campaign Name
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Provides context for the AI when generating recaps.
                      </p>
                      <Input
                        id="campaign-name"
                        placeholder="The Light of the World"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        className="inset-field mt-1.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="current-book" className="text-sm">
                          Current Book
                        </Label>
                        <Input
                          id="current-book"
                          type="number"
                          min="1"
                          placeholder="1"
                          value={currentBook}
                          onChange={(e) => setCurrentBook(e.target.value)}
                          className="inset-field mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="current-act" className="text-sm">
                          Current Act
                        </Label>
                        <Input
                          id="current-act"
                          type="number"
                          min="1"
                          placeholder="1"
                          value={currentAct}
                          onChange={(e) => setCurrentAct(e.target.value)}
                          className="inset-field mt-1.5"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Party Tab */}
          <TabsContent value="party" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <Users className="h-4 w-4 text-accent" />
                    Adventuring Party
                  </h3>
                  <div className="pl-6">
                    <PlayerConfigEditor
                      players={players}
                      onPlayersChange={setPlayers}
                      detectedSpeakers={detectedSpeakers}
                    />
                  </div>
                </section>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* NPCs Tab */}
          <TabsContent value="npcs" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <UserCircle className="h-4 w-4 text-accent" />
                    Non-Player Characters
                  </h3>
                  <div className="pl-6">
                    <NPCConfigEditor
                      npcs={npcs}
                      onNpcsChange={setNpcs}
                      detectedNPCs={detectedNPCs}
                    />
                  </div>
                </section>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* AI Settings Tab */}
          <TabsContent value="ai" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* API Key */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-accent" />
                    <Label htmlFor="api-key" className="text-sm font-medium">
                      OpenAI API Key
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your key is stored locally and only sent to OpenAI for generation.{" "}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Get an API key
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
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
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-accent" />
                    <Label className="text-sm font-medium">AI Model</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only text-capable models are shown, filtered to 400K+ context by default. Recommendations favor newer, cost-effective models.
                  </p>
                  <ModelSelector
                    value={selectedModel}
                    onChange={setSelectedModel}
                  />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Fixed Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border/40 shrink-0">
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
