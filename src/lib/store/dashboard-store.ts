import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  InsightsResponse,
  CompetitorComparisonResponse,
  Scan,
  VisibilityScoreAggregate,
} from "@/lib/types";
import { getInvoke } from "./tauri-helpers";

interface DashboardState {
  insights: InsightsResponse | null;
  competitorComparison: CompetitorComparisonResponse | null;
  recentScans: Scan[];
  visibilityScores: VisibilityScoreAggregate[];
  isLoading: boolean;
  error: string | null;
}

interface DashboardActions {
  loadDashboard: (projectId: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState & DashboardActions>()(
  immer((set) => ({
    insights: null,
    competitorComparison: null,
    recentScans: [],
    visibilityScores: [],
    isLoading: false,
    error: null,

    loadDashboard: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const [insightsRaw, scans, scores, compRaw] = await Promise.all([
          invoke<string>("get_insights", { projectId }),
          invoke<Scan[]>("get_scans", { projectId }),
          invoke<VisibilityScoreAggregate[]>("get_visibility_scores", {
            projectId,
          }),
          invoke<string>("get_competitor_comparison", { projectId }),
        ]);
        set((state) => {
          state.insights = JSON.parse(insightsRaw) as InsightsResponse;
          state.competitorComparison = JSON.parse(compRaw) as CompetitorComparisonResponse;
          state.recentScans = scans.slice(0, 5);
          state.visibilityScores = scores;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to load dashboard data";
          state.isLoading = false;
        });
      }
    },
  }))
);
