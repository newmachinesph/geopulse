import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ActionItem } from "@/lib/types";
import { getInvoke } from "./tauri-helpers";

interface ActionsState {
  actions: ActionItem[];
  isLoading: boolean;
  error: string | null;
}

interface ActionsActions {
  loadActions: (projectId: string) => Promise<void>;
  updateActionStatus: (id: string, status: string) => Promise<void>;
  dismissAction: (id: string) => Promise<void>;
  clearActions: (projectId: string) => Promise<void>;
}

export const useActionsStore = create<ActionsState & ActionsActions>()(
  immer((set) => ({
    actions: [],
    isLoading: false,
    error: null,

    loadActions: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const actions = await invoke<ActionItem[]>("get_actions", {
          projectId,
        });
        set((state) => {
          state.actions = actions;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to load actions";
          state.isLoading = false;
        });
      }
    },

    updateActionStatus: async (id: string, status: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const updated = await invoke<ActionItem | null>("update_action", {
          id,
          status,
        });
        if (updated) {
          set((state) => {
            const index = state.actions.findIndex((a) => a.id === id);
            if (index !== -1) {
              state.actions[index] = updated;
            }
            state.isLoading = false;
          });
        }
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to update action status";
          state.isLoading = false;
        });
      }
    },

    clearActions: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        await invoke<number>("clear_actions", { projectId });
        set((state) => {
          state.actions = [];
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to clear actions";
          state.isLoading = false;
        });
      }
    },

    dismissAction: async (id: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        await invoke<boolean>("dismiss_action", { id });
        set((state) => {
          const index = state.actions.findIndex((a) => a.id === id);
          if (index !== -1) {
            state.actions[index].status = "dismissed";
          }
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to dismiss action";
          state.isLoading = false;
        });
      }
    },
  }))
);
