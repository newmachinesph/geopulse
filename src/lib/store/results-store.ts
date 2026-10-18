import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ParsedResult, RawResponse, Citation } from "@/lib/types";
import { getInvoke } from "./tauri-helpers";

interface ResultsState {
  results: ParsedResult[];
  promptResults: ParsedResult[];
  rawResponses: Record<string, RawResponse>;
  citations: Record<string, Citation[]>;
  isLoading: boolean;
  error: string | null;
}

interface ResultsActions {
  loadResults: (scanId: string) => Promise<void>;
  loadPromptResults: (promptId: string) => Promise<void>;
  loadRawResponse: (id: string) => Promise<void>;
  loadCitations: (parsedResultId: string) => Promise<void>;
}

export const useResultsStore = create<ResultsState & ResultsActions>()(
  immer((set) => ({
    results: [],
    promptResults: [],
    rawResponses: {},
    citations: {},
    isLoading: false,
    error: null,

    loadResults: async (scanId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const results = await invoke<ParsedResult[]>("get_scan_results", {
          scanId,
        });
        set((state) => {
          state.results = results;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to load results";
          state.isLoading = false;
        });
      }
    },

    loadPromptResults: async (promptId: string) => {
      set((state) => { state.isLoading = true; state.error = null; });
      try {
        const invoke = await getInvoke();
        const results = await invoke<ParsedResult[]>("get_prompt_results", { promptId });
        set((state) => {
          state.promptResults = results;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Failed to load prompt results";
          state.isLoading = false;
        });
      }
    },

    loadRawResponse: async (id: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const response = await invoke<RawResponse | null>("get_raw_response", {
          id,
        });
        if (response) {
          set((state) => {
            state.rawResponses[id] = response;
            state.isLoading = false;
          });
        }
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to load raw response";
          state.isLoading = false;
        });
      }
    },

    loadCitations: async (parsedResultId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const citations = await invoke<Citation[]>("get_citations", {
          parsedResultId,
        });
        set((state) => {
          state.citations[parsedResultId] = citations;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to load citations";
          state.isLoading = false;
        });
      }
    },
  }))
);
