import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  Prompt,
  CreatePromptInput,
  UpdatePromptInput,
} from "@/lib/types";
import { getInvoke } from "./tauri-helpers";

interface PromptsState {
  prompts: Prompt[];
  selectedPromptId: string | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
}

interface PromptsActions {
  loadPrompts: (projectId: string) => Promise<void>;
  createPrompt: (input: CreatePromptInput) => Promise<void>;
  updatePrompt: (id: string, input: UpdatePromptInput) => Promise<void>;
  deletePromptById: (id: string) => Promise<void>;
  deletePromptsByIds: (ids: string[]) => Promise<void>;
  clearPrompts: (projectId: string) => Promise<void>;
  selectPrompt: (id: string | null) => void;
  generatePrompts: (projectId: string, intentCategory: string) => Promise<void>;
}

export const usePromptsStore = create<PromptsState & PromptsActions>()(
  immer((set) => ({
    prompts: [],
    selectedPromptId: null,
    isLoading: false,
    isGenerating: false,
    error: null,

    loadPrompts: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const prompts = await invoke<Prompt[]>("get_prompts", { projectId });
        set((state) => {
          state.prompts = prompts;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to load prompts";
          state.isLoading = false;
        });
      }
    },

    createPrompt: async (input: CreatePromptInput) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const prompt = await invoke<Prompt>("create_prompt", { input });
        set((state) => {
          state.prompts.push(prompt);
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to create prompt";
          state.isLoading = false;
        });
      }
    },

    updatePrompt: async (id: string, input: UpdatePromptInput) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const updated = await invoke<Prompt | null>("update_prompt", {
          id,
          input,
        });
        if (updated) {
          set((state) => {
            const index = state.prompts.findIndex((p) => p.id === id);
            if (index !== -1) {
              state.prompts[index] = updated;
            }
            state.isLoading = false;
          });
        }
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to update prompt";
          state.isLoading = false;
        });
      }
    },

    deletePromptById: async (id: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        await invoke<boolean>("delete_prompt", { id });
        set((state) => {
          state.prompts = state.prompts.filter((p) => p.id !== id);
          if (state.selectedPromptId === id) {
            state.selectedPromptId = null;
          }
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to delete prompt";
          state.isLoading = false;
        });
      }
    },

    deletePromptsByIds: async (ids: string[]) => {
      set((state) => { state.isLoading = true; state.error = null; });
      try {
        const invoke = await getInvoke();
        for (const id of ids) {
          await invoke<boolean>("delete_prompt", { id });
        }
        set((state) => {
          const idSet = new Set(ids);
          state.prompts = state.prompts.filter((p) => !idSet.has(p.id));
          if (state.selectedPromptId && idSet.has(state.selectedPromptId)) {
            state.selectedPromptId = null;
          }
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Failed to delete prompts";
          state.isLoading = false;
        });
      }
    },

    clearPrompts: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        await invoke<number>("clear_prompts", { projectId });
        set((state) => {
          state.prompts = [];
          state.selectedPromptId = null;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to clear prompts";
          state.isLoading = false;
        });
      }
    },

    selectPrompt: (id: string | null) => {
      set((state) => {
        state.selectedPromptId = id;
      });
    },

    generatePrompts: async (projectId: string, intentCategory: string) => {
      set((state) => {
        state.isGenerating = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const generated = await invoke<Prompt[]>("generate_prompts", {
          projectId,
          intentCategory,
        });
        set((state) => {
          state.prompts = [...state.prompts, ...generated];
          state.isGenerating = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to generate prompts";
          state.isGenerating = false;
        });
      }
    },
  }))
);
