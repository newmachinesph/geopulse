import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { PageLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { PromptScoreBadge } from "@/components/prompts";
import { usePromptsStore, useResultsStore } from "@/lib/store";
import { getEngineLabel, getEngineColor, getScoreVariant, getSentimentLabel } from "@/lib/utils";

export default function PromptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { prompts } = usePromptsStore();
  const { promptResults, isLoading, loadPromptResults } = useResultsStore();

  const prompt = prompts.find((p) => p.id === id);

  useEffect(() => {
    if (id) {
      loadPromptResults(id);
    }
  }, [id, loadPromptResults]);

  // Engine comparison: avg score per engine
  const engineStats = useMemo(() => {
    const map = new Map<string, { total: number; count: number; mentions: number }>();
    for (const r of promptResults) {
      const existing = map.get(r.engine) ?? { total: 0, count: 0, mentions: 0 };
      existing.total += r.visibilityScore;
      existing.count += 1;
      if (r.brandMentioned) existing.mentions += 1;
      map.set(r.engine, existing);
    }
    return Array.from(map.entries())
      .map(([engine, data]) => ({
        engine,
        avgScore: data.total / data.count,
        mentionRate: data.mentions / data.count,
        count: data.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [promptResults]);

  return (
    <PageLayout
      title="Prompt Detail"
      subtitle={prompt ? prompt.intentCategory : `Prompt ${id}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prompt Text</CardTitle>
            </CardHeader>
            <CardContent>
              {prompt ? (
                <p className="text-sm text-foreground">{prompt.text}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Prompt not found. Navigate from the Prompts list.</p>
              )}
              {prompt?.tags && prompt.tags !== "[]" && (
                <div className="flex gap-1 mt-3">
                  {(JSON.parse(prompt.tags) as string[]).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Engine Comparison */}
          {engineStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Engine Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {engineStats.map((es) => (
                    <div key={es.engine} className="flex items-center gap-3">
                      <span className={`text-sm font-medium w-24 ${getEngineColor(es.engine)}`}>
                        {getEngineLabel(es.engine)}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${(es.avgScore / 5) * 100}%` }}
                        />
                      </div>
                      <Badge variant={getScoreVariant(es.avgScore)} className="text-xs w-14 justify-center">
                        {es.avgScore.toFixed(1)}
                      </Badge>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {(es.mentionRate * 100).toFixed(0)}% mentioned
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Result History {promptResults.length > 0 && `(${promptResults.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && promptResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading results...</p>
              ) : promptResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scan results yet. Start a scan to see results.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-3">Date</th>
                        <th className="pb-2 pr-3">Engine</th>
                        <th className="pb-2 pr-3">Market</th>
                        <th className="pb-2 pr-3">Score</th>
                        <th className="pb-2 pr-3">Sentiment</th>
                        <th className="pb-2">Mentioned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promptResults.slice(0, 50).map((r) => (
                        <tr key={r.id} className="border-b border-border/50">
                          <td className="py-2 pr-3 text-xs text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                          <td className={`py-2 pr-3 text-xs ${getEngineColor(r.engine)}`}>
                            {getEngineLabel(r.engine)}
                          </td>
                          <td className="py-2 pr-3 text-xs">{r.market.toUpperCase()}</td>
                          <td className="py-2 pr-3">
                            <Badge variant={getScoreVariant(r.visibilityScore)} className="text-xs">
                              {r.visibilityScore.toFixed(1)}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3">
                            <Badge
                              variant={r.sentimentLevel === "positive" ? "positive" : r.sentimentLevel === "negative" ? "negative" : "neutral"}
                              className="text-xs"
                            >
                              {getSentimentLabel(r.sentimentLevel)}
                            </Badge>
                          </td>
                          <td className="py-2 text-xs">
                            {r.brandMentioned ? "Yes" : "No"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average Score</span>
                <PromptScoreBadge score={prompt?.avgScore ?? 0} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Runs</span>
                <span>{prompt?.runCount ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Intent</span>
                <Badge variant="secondary">{prompt?.intentCategory ?? "-"}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={prompt?.status === "active" ? "default" : "outline"}
                >
                  {prompt?.status ?? "-"}
                </Badge>
              </div>
              {prompt?.lastRunAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Run</span>
                  <span className="text-xs">{new Date(prompt.lastRunAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
