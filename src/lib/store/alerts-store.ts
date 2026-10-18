import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Alert } from "@/lib/types";
import { getInvoke } from "./tauri-helpers";

interface AlertsState {
  alerts: Alert[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  loadAlerts: (projectId: string) => Promise<void>;
  loadUnreadAlerts: (projectId: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: (projectId: string) => Promise<void>;
}

export const useAlertsStore = create<AlertsState>()(
  immer((set) => ({
    alerts: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    loadAlerts: async (projectId: string) => {
      set((state) => { state.isLoading = true; state.error = null; });
      try {
        const invoke = await getInvoke();
        const alerts = await invoke<Alert[]>("get_alerts", { projectId });
        set((state) => {
          state.alerts = alerts;
          state.unreadCount = alerts.filter((a) => !a.isRead).length;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Failed to load alerts";
          state.isLoading = false;
        });
      }
    },

    loadUnreadAlerts: async (projectId: string) => {
      try {
        const invoke = await getInvoke();
        const alerts = await invoke<Alert[]>("get_unread_alerts", { projectId });
        set((state) => {
          state.unreadCount = alerts.length;
        });
      } catch {
        // Silent fail for polling
      }
    },

    markRead: async (id: string) => {
      try {
        const invoke = await getInvoke();
        await invoke<boolean>("mark_alert_read", { id });
        set((state) => {
          const alert = state.alerts.find((a) => a.id === id);
          if (alert && !alert.isRead) {
            alert.isRead = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        });
      } catch {
        // Silent fail
      }
    },

    markAllRead: async (projectId: string) => {
      try {
        const invoke = await getInvoke();
        await invoke<void>("mark_all_alerts_read", { projectId });
        set((state) => {
          state.alerts.forEach((a) => { a.isRead = true; });
          state.unreadCount = 0;
        });
      } catch {
        // Silent fail
      }
    },
  }))
);
