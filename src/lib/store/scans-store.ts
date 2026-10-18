import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Scan } from "@/lib/types";
import { getInvoke } from "./tauri-helpers";

interface ScansState {
  scans: Scan[];
  activeScanId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface ScansActions {
  loadScans: (projectId: string) => Promise<void>;
  refreshScan: (id: string) => Promise<void>;
  startScan: (projectId: string, config: string) => Promise<void>;
  cancelScan: (id: string) => Promise<void>;
  pauseScan: (id: string) => Promise<void>;
  resumeScan: (id: string) => Promise<void>;
  deleteScan: (id: string) => Promise<void>;
  clearScans: (projectId: string) => Promise<void>;
  selectScan: (id: string | null) => void;
}

export const useScansStore = create<ScansState & ScansActions>()(
  immer((set) => ({
    scans: [],
    activeScanId: null,
    isLoading: false,
    error: null,

    loadScans: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const scans = await invoke<Scan[]>("get_scans", { projectId });
        set((state) => {
          state.scans = scans;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to load scans";
          state.isLoading = false;
        });
      }
    },

    refreshScan: async (id: string) => {
      try {
        const invoke = await getInvoke();
        const scan = await invoke<Scan | null>("get_scan", { id });
        if (scan) {
          set((state) => {
            const index = state.scans.findIndex((s) => s.id === id);
            if (index !== -1) {
              state.scans[index] = scan;
            } else {
              state.scans.push(scan);
            }
          });
        }
      } catch {
        // Silent fail for polling
      }
    },

    startScan: async (projectId: string, config: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const scan = await invoke<Scan>("start_scan", { projectId, config });
        set((state) => {
          state.scans.push(scan);
          state.activeScanId = scan.id;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to start scan";
          state.isLoading = false;
        });
      }
    },

    cancelScan: async (id: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        await invoke<boolean>("cancel_scan", { id });
        set((state) => {
          const index = state.scans.findIndex((s) => s.id === id);
          if (index !== -1) {
            state.scans[index].status = "cancelled";
          }
          if (state.activeScanId === id) {
            state.activeScanId = null;
          }
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to cancel scan";
          state.isLoading = false;
        });
      }
    },

    pauseScan: async (id: string) => {
      try {
        const invoke = await getInvoke();
        await invoke<boolean>("pause_scan", { id });
        set((state) => {
          const index = state.scans.findIndex((s) => s.id === id);
          if (index !== -1) {
            state.scans[index].status = "paused";
          }
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to pause scan";
        });
      }
    },

    resumeScan: async (id: string) => {
      try {
        const invoke = await getInvoke();
        await invoke<boolean>("resume_scan", { id });
        set((state) => {
          const index = state.scans.findIndex((s) => s.id === id);
          if (index !== -1) {
            state.scans[index].status = "running";
          }
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to resume scan";
        });
      }
    },

    deleteScan: async (id: string) => {
      try {
        const invoke = await getInvoke();
        await invoke<boolean>("delete_scan", { id });
        set((state) => {
          state.scans = state.scans.filter((s) => s.id !== id);
          if (state.activeScanId === id) {
            state.activeScanId = null;
          }
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to delete scan";
        });
      }
    },

    clearScans: async (projectId: string) => {
      try {
        const invoke = await getInvoke();
        await invoke<number>("clear_scans", { projectId });
        set((state) => {
          state.scans = [];
          state.activeScanId = null;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to clear scans";
        });
      }
    },

    selectScan: (id: string | null) => {
      set((state) => {
        state.activeScanId = id;
      });
    },
  }))
);
