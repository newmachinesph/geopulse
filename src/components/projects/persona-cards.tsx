import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  IconUser,
  IconBulb,
  IconMessageCircle,
  IconSparkles,
} from "@tabler/icons-react";
import type { PersonaDetail, PersonaPrompt, IntentCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PersonaCardProps {
  persona: PersonaDetail;
  onUsePrompts?: (prompts: PersonaPrompt[]) => void;
}

interface PersonaSectionProps {
  personas: PersonaDetail[];
  isGenerating?: boolean;
  onGenerate?: () => void;
  onUsePrompts?: (prompts: PersonaPrompt[]) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INTENT_COLOR_MAP: Record<IntentCategory, string> = {
  informational: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  navigational: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  commercial: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  transactional: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  comparison: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  recommendation: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

function IntentBadge({ intent }: { intent: IntentCategory }) {
  const colorClasses = INTENT_COLOR_MAP[intent] || "";
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize " +
        colorClasses
      }
    >
      {intent}
    </span>
  );
}

// ---------------------------------------------------------------------------
// PersonaCard
// ---------------------------------------------------------------------------

export function PersonaCard({ persona, onUsePrompts }: PersonaCardProps) {
  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
      {/* ---- Header ---- */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <IconUser className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base text-foreground">
                {persona.name}, {persona.age} years old
              </CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ---- Bio ---- */}
        <p className="text-sm leading-relaxed text-muted-foreground">
          {persona.bio}
        </p>

        {/* ---- Pain Points ---- */}
        {persona.painPoints.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <IconBulb className="h-4 w-4 text-amber-400" />
              <span>Pain Points</span>
            </div>
            <ul className="space-y-1.5 pl-1">
              {persona.painPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/70" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ---- Sample Prompts ---- */}
        {persona.samplePrompts.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <IconMessageCircle className="h-4 w-4 text-emerald-400" />
              <span>Sample Prompts</span>
            </div>
            <div className="space-y-2">
              {persona.samplePrompts.map((prompt, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3"
                >
                  <p className="text-sm text-foreground">{prompt.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <IntentBadge intent={prompt.intentCategory} />
                    <Badge variant="outline" className="text-[11px]">
                      {prompt.market}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px]">
                      {prompt.language}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Use Prompts action ---- */}
        {onUsePrompts && persona.samplePrompts.length > 0 && (
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              onClick={() => onUsePrompts(persona.samplePrompts)}
            >
              <IconSparkles className="h-4 w-4" />
              Use These Prompts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PersonaSection
// ---------------------------------------------------------------------------

export function PersonaSection({
  personas,
  isGenerating = false,
  onGenerate,
  onUsePrompts,
}: PersonaSectionProps) {
  // ---- Empty state ----
  if (personas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/40 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <IconUser className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          No Personas Yet
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Generate AI-powered customer personas to understand your target
          audience and discover high-value search prompts.
        </p>
        {onGenerate && (
          <Button
            className="mt-6"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            <IconSparkles className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Personas"}
          </Button>
        )}
      </div>
    );
  }

  // ---- Populated state ----
  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconUser className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-foreground">
            Customer Personas
          </h2>
          <Badge variant="secondary" className="ml-1">
            {personas.length}
          </Badge>
        </div>
        {onGenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            <IconSparkles className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Personas"}
          </Button>
        )}
      </div>

      {/* Persona cards grid */}
      <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {personas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            onUsePrompts={onUsePrompts}
          />
        ))}
      </div>
    </div>
  );
}
