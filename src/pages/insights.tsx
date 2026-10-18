import { useEffect, useMemo } from "react";
import { PageLayout } from "@/components/layout";
import { ProjectSelector } from "@/components/layout/project-selector";
import { GapAnalysisCard, CompetitorComparison, SourceCoverage } from "@/components/insights";
import { VisibilityTrendChart } from "@/components/charts";
import { useInsightsStore, useProjectsStore } from "@/lib/store";

export default function InsightsPage() {
  const { selectedProjectId } = useProjectsStore();
  const { insights, gapAnalysis, competitorComparison, isLoading, loadAll } =
    useInsightsStore();

  useEffect(() => {
    if (selectedProjectId) {
      loadAll(selectedProjectId);
    }
  }, [selectedProjectId, loadAll]);

  // Map trend data: backend sends googleAio, chart expects google_aio
  const trendData = useMemo(
    () =>
      (insights?.trend ?? []).map((t) => ({
        date: t.date,
        chatgpt: t.chatgpt,
        perplexity: t.perplexity,
        google_aio: t.googleAio,
      })),
    [insights?.trend]
  );

  // Map source data: backend sends sourceType, component expects type
  const sourcesData = useMemo(
    () =>
      (insights?.sources ?? []).map((s) => ({
        type: s.sourceType,
        count: s.count,
        domains: s.domains,
      })),
    [insights?.sources]
  );

  const brand = competitorComparison?.brand ?? {
    name: "Your Brand",
    avgScore: 0,
    mentionRate: 0,
  };

  return (
    <PageLayout title="Insights" subtitle="Visibility gaps and competitive analysis">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <ProjectSelector />
          {isLoading && (
            <span className="text-sm text-muted-foreground">Loading...</span>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GapAnalysisCard gaps={gapAnalysis?.gaps ?? []} />
          <CompetitorComparison
            brand={brand}
            competitors={competitorComparison?.competitors ?? []}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VisibilityTrendChart data={trendData} />
          <SourceCoverage sources={sourcesData} />
        </div>
      </div>
    </PageLayout>
  );
}
