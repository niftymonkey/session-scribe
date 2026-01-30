import { Swords, Theater, Search, Brain, Laugh, Quote, MapPin, Users, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { SessionRecap, HighlightCategory, SceneSection } from "@/types";

interface RecapDisplayProps {
  recap: SessionRecap;
}

const categoryConfig: Record<HighlightCategory, { icon: React.ReactNode; color: string; bg: string }> = {
  combat: {
    icon: <Swords className="h-4 w-4" />,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
  },
  roleplay: {
    icon: <Theater className="h-4 w-4" />,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
  },
  discovery: {
    icon: <Search className="h-4 w-4" />,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
  },
  decision: {
    icon: <Brain className="h-4 w-4" />,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  },
  humor: {
    icon: <Laugh className="h-4 w-4" />,
    color: "text-teal-400",
    bg: "bg-teal-400/10",
  },
};

function SceneHighlightsSection({ sceneHighlights }: { sceneHighlights: SceneSection[] }) {
  if (!sceneHighlights || sceneHighlights.length === 0) return null;

  return (
    <section>
      <h2 className="text-base font-medium mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
        <span className="w-8 h-px bg-border" />
        Session Events
        <span className="flex-1 h-px bg-border" />
      </h2>
      <div className="space-y-6">
        {sceneHighlights.map((scene, i) => (
          <div key={i} className="space-y-3">
            {/* Scene Header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10">
                <MapPin className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-medium">{scene.sceneName}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {scene.timeOfDay && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {scene.timeOfDay}
                    </span>
                  )}
                  {scene.charactersPresent.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {scene.charactersPresent.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Scene Highlights */}
            <ul className="space-y-2 pl-11">
              {scene.highlights.map((highlight, j) => (
                <li key={j} className="text-sm">
                  <span className="text-foreground">{highlight.text}</span>
                  {highlight.subBullets && highlight.subBullets.length > 0 && (
                    <ul className="mt-1 space-y-1 pl-4 border-l border-border/30">
                      {highlight.subBullets.map((sub, k) => (
                        <li key={k} className="text-xs text-muted-foreground">
                          {sub}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RecapDisplay({ recap }: RecapDisplayProps) {
  return (
    <div className="surface-card rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/30 text-center">
        <h1 className="text-2xl text-glow" style={{ fontFamily: 'var(--font-display)' }}>
          {recap.header.sessionTitle}
        </h1>
        <div className="flex items-center justify-center gap-3 mt-2 text-sm text-muted-foreground">
          <span>{recap.header.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          {recap.header.missionName && (
            <>
              <span className="text-accent">•</span>
              <span className="italic">{recap.header.missionName}</span>
            </>
          )}
        </div>
        {/* Metadata */}
        {recap.metadata && recap.metadata.charactersPresent.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="font-medium">Characters:</span> {recap.metadata.charactersPresent.join(", ")}
            {recap.metadata.inGameTime && (
              <span className="ml-3"><span className="font-medium">In-Game:</span> {recap.metadata.inGameTime}</span>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="h-[600px]">
        <div className="p-6 space-y-8">
          {/* Opening Context */}
          {recap.openingContext && (
            <section>
              <h2 className="text-base font-medium mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="w-8 h-px bg-border" />
                Opening
                <span className="flex-1 h-px bg-border" />
              </h2>
              <div className="p-4 rounded-lg bg-card/50 border border-border/30">
                <p className="text-sm text-muted-foreground leading-relaxed">{recap.openingContext.startingState}</p>
                {recap.openingContext.objectives.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-foreground mb-1">Objectives:</p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      {recap.openingContext.objectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Scene Highlights (new exhaustive format) */}
          <SceneHighlightsSection sceneHighlights={recap.sceneHighlights} />

          {/* Legacy Highlights (categorized) */}
          <section>
            <h2 className="text-base font-medium mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="w-8 h-px bg-border" />
              Key Moments
              <span className="flex-1 h-px bg-border" />
            </h2>
            <div className="space-y-3">
              {recap.highlights.map((highlight, i) => {
                const config = categoryConfig[highlight.category];
                return (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border border-border/30 hover:border-border/50 transition-colors"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg", config.bg)}>
                      <div className={config.color}>{config.icon}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">{highlight.description}</p>
                      {highlight.participants && highlight.participants.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          — {highlight.participants.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quotes */}
          {recap.quotes.length > 0 && (
            <section>
              <h2 className="text-base font-medium mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="w-8 h-px bg-border" />
                Memorable Words
                <span className="flex-1 h-px bg-border" />
              </h2>
              <div className="space-y-4">
                {recap.quotes.map((quote, i) => (
                  <div
                    key={i}
                    className="relative pl-6 py-3 border-l-2 border-accent/40"
                  >
                    <Quote className="absolute -left-3 top-3 h-5 w-5 text-accent bg-card p-0.5 rounded" />
                    <blockquote className="text-base italic leading-relaxed">
                      "{quote.text}"
                    </blockquote>
                    <cite className="block text-sm text-muted-foreground mt-2 not-italic">
                      — {quote.speaker}
                      {quote.context && (
                        <span className="text-muted-foreground/70"> ({quote.context})</span>
                      )}
                    </cite>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Narrative */}
          <section>
            <h2 className="text-base font-medium mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="w-8 h-px bg-border" />
              The Tale
              <span className="flex-1 h-px bg-border" />
            </h2>
            <div className="prose-custom">
              {recap.narrative.split(/\n\n+/).map((para, i) => (
                <p
                  key={i}
                  className="text-sm text-muted-foreground leading-relaxed mb-4 first-letter:text-2xl first-letter:font-semibold first-letter:text-foreground first-letter:mr-0.5"
                  style={{ textIndent: i > 0 ? '1.5em' : 0 }}
                >
                  {para}
                </p>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
