import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  InsightsResponse,
  GapAnalysisResponse,
  CompetitorComparisonResponse,
} from "@/lib/types";
import { getInvoke } from "./tauri-helpers";

interface InsightsState {
  insights: InsightsResponse | null;
  gapAnalysis: GapAnalysisResponse | null;
  competitorComparison: CompetitorComparisonResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface InsightsActions {
  loadInsights: (projectId: string) => Promise<void>;
  loadGapAnalysis: (projectId: string) => Promise<void>;
  loadCompetitorComparison: (projectId: string) => Promise<void>;
  loadAll: (projectId: string) => Promise<void>;
}

export const useInsightsStore = create<InsightsState & InsightsActions>()(
  immer((set) => ({
    insights: null,
    gapAnalysis: null,
    competitorComparison: null,
    isLoading: false,
    error: null,

    loadInsights: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const raw = await invoke<string>("get_insights", { projectId });
        const parsed = JSON.parse(raw) as InsightsResponse;
        set((state) => {
          state.insights = parsed;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to load insights";
          state.isLoading = false;
        });
      }
    },

    loadGapAnalysis: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const raw = await invoke<string>("get_gap_analysis", { projectId });
        const parsed = JSON.parse(raw) as GapAnalysisResponse;
        set((state) => {
          state.gapAnalysis = parsed;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to load gap analysis";
          state.isLoading = false;
        });
      }
    },

    loadCompetitorComparison: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const raw = await invoke<string>("get_competitor_comparison", {
          projectId,
        });
        const parsed = JSON.parse(raw) as CompetitorComparisonResponse;
        set((state) => {
          state.competitorComparison = parsed;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to load competitor comparison";
          state.isLoading = false;
        });
      }
    },

    loadAll: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const [insightsRaw, gapRaw, compRaw] = await Promise.all([
          invoke<string>("get_insights", { projectId }),
          invoke<string>("get_gap_analysis", { projectId }),
          invoke<string>("get_competitor_comparison", { projectId }),
        ]);
        set((state) => {
          state.insights = JSON.parse(insightsRaw) as InsightsResponse;
          state.gapAnalysis = JSON.parse(gapRaw) as GapAnalysisResponse;
          state.competitorComparison = JSON.parse(
            compRaw
          ) as CompetitorComparisonResponse;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to load insights data";
          state.isLoading = false;
        });
      }
    },
  }))
);
