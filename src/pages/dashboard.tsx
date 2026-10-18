import { useEffect, useMemo, useRef } from "react";
import { PageLayout } from "@/components/layout";
import { ProjectSelector } from "@/components/layout/project-selector";
import { DashboardSkeleton } from "@/components/layout/loading-skeleton";
import {
  VisibilityScoreCard,
  EngineBreakdown,
  MarketOverview,
  RecentScans,
  ShareOfVoiceCard,
} from "@/components/dashboard";
import { VisibilityTrendChart } from "@/components/charts";
import { useDashboardStore, useProjectsStore, useSettingsStore } from "@/lib/store";
import { OnboardingFlow } from "@/components/onboarding";
import { startWalkthrough, shouldShowWalkthrough } from "@/lib/walkthrough";

export default function DashboardPage() {
  const { projects, selectedProjectId, isLoading: projectsLoading, loadProjects } = useProjectsStore();
  const { insights, competitorComparison, recentScans, visibilityScores, isLoading, loadDashboard } =
    useDashboardStore();
  const { isInitialized, loadSettings } = useSettingsStore();

  // Load projects and settings on mount to detect first-run
  useEffect(() => {
    loadProjects();
    if (!isInitialized) loadSettings();
  }, [loadProjects, isInitialized, loadSettings]);

  useEffect(() => {
    if (selectedProjectId) {
      loadDashboard(selectedProjectId);
    }
  }, [selectedProjectId, loadDashboard]);

  // Auto-start walkthrough on first visit
  const walkthroughShown = useRef(false);
  useEffect(() => {
    if (!walkthroughShown.current && !projectsLoading && shouldShowWalkthrough()) {
      walkthroughShown.current = true;
      const timer = setTimeout(() => startWalkthrough(), 800);
      return () => clearTimeout(timer);
    }
  }, [projectsLoading]);

  // Map trend data for chart
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

  // Map visibility scores to engine breakdown format
  const engineData = useMemo(
    () =>
      visibilityScores.map((s) => ({
        engine: s.engine,
        avgScore: s.avgScore,
        mentionRate: s.mentionRate,
        promptCount: s.promptCount,
      })),
    [visibilityScores]
  );

  // Map competitor comparison data for ShareOfVoiceCard
  const competitorData = useMemo(
    () =>
      (competitorComparison?.competitors ?? []).map((c) => ({
        name: c.name,
        share: c.mentionRate,
      })),
    [competitorComparison?.competitors]
  );

  // Derive market data from visibility scores (group by market)
  const marketData = useMemo(() => {
    const byMarket = new Map<string, { totalScore: number; totalMention: number; count: number }>();
    for (const s of visibilityScores) {
      const existing = byMarket.get(s.market) ?? { totalScore: 0, totalMention: 0, count: 0 };
      existing.totalScore += s.avgScore;
      existing.totalMention += s.mentionRate;
      existing.count += 1;
      byMarket.set(s.market, existing);
    }
    return Array.from(byMarket.entries()).map(([market, data]) => ({
      market,
      avgScore: data.totalScore / data.count,
      mentionRate: data.totalMention / data.count,
    }));
  }, [visibilityScores]);

  // Show onboarding if no projects exist (first-run)
  if (!projectsLoading && projects.length === 0) {
    return <OnboardingFlow />;
  }

  return (
    <PageLayout title="Dashboard" subtitle="AI Visibility Overview">
      <div className="space-y-6">
        <ProjectSelector />

        {/* Stats Row */}
        <div id="dashboard-stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div id="visibility-score">
            <VisibilityScoreCard
              score={insights?.avgVisibility ?? 0}
              promptCount={insights?.totalScans ?? 0}
            />
          </div>
          <div id="share-of-voice">
            <ShareOfVoiceCard
              brandShare={insights?.mentionRate ?? 0}
              competitors={competitorData}
            />
          </div>
          <div id="engine-breakdown" className="lg:col-span-2">
            <EngineBreakdown engines={engineData} />
          </div>
        </div>

        {/* Charts Row */}
        <div id="dashboard-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div id="trend-chart">
            <VisibilityTrendChart data={trendData} />
          </div>
          <div id="market-overview">
            <MarketOverview markets={marketData} />
          </div>
        </div>

        {/* Recent Scans */}
        <div id="recent-scans">
          <RecentScans scans={recentScans} />
        </div>

        {isLoading && !insights && <DashboardSkeleton />}
      </div>
    </PageLayout>
  );
}
