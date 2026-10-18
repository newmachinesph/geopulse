import { useEffect, useMemo } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
  Badge, ScrollArea, Card, CardContent,
} from "@/components/ui";
import { useResultsStore } from "@/lib/store";
import { getEngineLabel, getEngineColor, getScoreVariant, getSentimentLabel } from "@/lib/utils";
import type { ParsedResult } from "@/lib/types";
import { IconCheck, IconX, IconExternalLink, IconShield } from "@tabler/icons-react";

interface ResultDetailSheetProps {
  result: ParsedResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sourceTypeColors: Record<string, "default" | "positive" | "destructive" | "secondary" | "outline"> = {
  owned: "positive",
  authority: "default",
  earned: "default",
  competitor: "destructive",
  third_party: "secondary",
  neutral: "secondary",
  unknown: "outline",
};

export function ResultDetailSheet({ result, open, onOpenChange }: ResultDetailSheetProps) {
  const { rawResponses, citations, loadRawResponse, loadCitations } = useResultsStore();

  useEffect(() => {
    if (result && open) {
      if (!rawResponses[result.rawResponseId]) {
        loadRawResponse(result.rawResponseId);
      }
      if (!citations[result.id]) {
        loadCitations(result.id);
      }
    }
  }, [result, open, rawResponses, citations, loadRawResponse, loadCitations]);

  const rawResponse = result ? rawResponses[result.rawResponseId] : null;
  const resultCitations = result ? citations[result.id] ?? [] : [];

  const competitors: string[] = useMemo(() => {
    if (!result?.competitorsMentioned) return [];
    try {
      return JSON.parse(result.competitorsMentioned);
    } catch {
      return [];
    }
  }, [result?.competitorsMentioned]);

  const scoreBreakdown = useMemo(() => {
    if (!result) return [];
    const items: { label: string; points: string; active: boolean }[] = [];
    const pos = result.mentionPosition;
    const isTop3 = result.brandMentioned && pos != null && pos <= 3;

    items.push({
      label: "Mentioned in top 3",
      points: "+3",
      active: isTop3,
    });
    items.push({
      label: "Mentioned (outside top 3)",
      points: "+1",
      active: result.brandMentioned && !isTop3,
    });
    items.push({
      label: "Positive/neutral sentiment",
      points: "+1",
      active: result.brandMentioned && result.sentimentLevel !== "negative",
    });
    items.push({
      label: "Authoritative citation",
      points: "+1",
      active: resultCitations.some((c) => c.isAuthoritative),
    });
    return items;
  }, [result, resultCitations]);

  if (!result) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className={getEngineColor(result.engine)}>{getEngineLabel(result.engine)}</span>
            <span className="text-muted-foreground font-normal text-sm">{result.market.toUpperCase()}</span>
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Badge variant={getScoreVariant(result.visibilityScore)}>
              {result.visibilityScore.toFixed(1)} / 5.0
            </Badge>
            <Badge variant={result.sentimentLevel === "positive" ? "positive" : result.sentimentLevel === "negative" ? "negative" : "neutral"}>
              {getSentimentLabel(result.sentimentLevel)}
            </Badge>
            <Badge variant={result.brandMentioned ? "positive" : "outline"}>
              {result.brandMentioned ? "Mentioned" : "Not mentioned"}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Brand Analysis */}
          <section>
            <h4 className="text-sm font-medium mb-2">Brand Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mentioned</span>
                <span className="flex items-center gap-1">
                  {result.brandMentioned
                    ? <><IconCheck className="h-3.5 w-3.5 text-positive" /> Yes</>
                    : <><IconX className="h-3.5 w-3.5 text-destructive" /> No</>}
                </span>
              </div>
              {result.mentionPosition != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position</span>
                  <span>Paragraph {result.mentionPosition}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entities mentioned</span>
                <span>{result.totalEntitiesMentioned}</span>
              </div>
              {result.brandContext && (
                <div className="mt-2">
                  <span className="text-muted-foreground block mb-1">Brand context</span>
                  <p className="text-xs bg-muted/50 rounded p-2 leading-relaxed">{result.brandContext}</p>
                </div>
              )}
            </div>
          </section>

          {/* Competitors */}
          {competitors.length > 0 && (
            <section>
              <h4 className="text-sm font-medium mb-2">Competitors Mentioned</h4>
              <div className="flex flex-wrap gap-1.5">
                {competitors.map((c) => (
                  <Badge key={c} variant="destructive" className="text-xs">{c}</Badge>
                ))}
              </div>
            </section>
          )}

          {/* Score Breakdown */}
          <section>
            <h4 className="text-sm font-medium mb-2">Score Breakdown</h4>
            <div className="space-y-1.5">
              {scoreBreakdown.map((item) => (
                <div key={item.label} className={`flex items-center justify-between text-sm rounded px-2 py-1 ${item.active ? "bg-muted/50" : "opacity-40"}`}>
                  <span className="flex items-center gap-1.5">
                    {item.active
                      ? <IconCheck className="h-3.5 w-3.5 text-positive" />
                      : <IconX className="h-3.5 w-3.5 text-muted-foreground" />}
                    {item.label}
                  </span>
                  <span className="font-mono text-xs">{item.active ? item.points : "—"}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm font-medium border-t pt-1.5 mt-1.5 px-2">
                <span>Total</span>
                <span className="font-mono">{result.visibilityScore.toFixed(1)}</span>
              </div>
            </div>
          </section>

          {/* Citations */}
          {resultCitations.length > 0 && (
            <section>
              <h4 className="text-sm font-medium mb-2">Citations ({resultCitations.length})</h4>
              <div className="space-y-2">
                {resultCitations.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 text-sm rounded border p-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={sourceTypeColors[c.sourceType] ?? "outline"} className="text-xs">
                          {c.sourceType}
                        </Badge>
                        {c.isAuthoritative && (
                          <IconShield className="h-3.5 w-3.5 text-positive" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{c.domain}</p>
                      {c.title && <p className="text-xs mt-0.5 truncate">{c.title}</p>}
                    </div>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <IconExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* AI Response */}
          <section>
            <h4 className="text-sm font-medium mb-2">Full AI Response</h4>
            {rawResponse ? (
              <div className="relative">
                <div className="text-xs text-muted-foreground mb-1">
                  Response time: {rawResponse.responseTimeMs}ms
                </div>
                <ScrollArea className="h-64 rounded border">
                  <pre className="text-xs p-3 whitespace-pre-wrap font-sans leading-relaxed">
                    {rawResponse.rawText}
                  </pre>
                </ScrollArea>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading response...</p>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
