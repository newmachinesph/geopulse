import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GeoSettings, ProxySettings, ScanDefaults } from "@/lib/types";
import { getInvoke } from "./tauri-helpers";

const defaultSettings: GeoSettings = {
  openaiApiKey: "",
  perplexityApiKey: "",
  googleApiKey: "",
  proxy: {
    enabled: false,
    server: "",
    username: "",
    password: "",
    protocol: "http",
    marketProxies: {},
  },
  scan: {
    defaultEngines: ["chatgpt", "perplexity", "google_aio"],
    defaultMarkets: ["us"],
    maxConcurrentScans: 3,
    timeoutSeconds: 120,
    autoSchedule: false,
    scheduleIntervalHours: 24,
  },
};

interface SettingsState {
  settings: GeoSettings;
  isInitialized: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

interface SettingsActions {
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  updateOpenaiApiKey: (key: string) => void;
  updatePerplexityApiKey: (key: string) => void;
  updateGoogleApiKey: (key: string) => void;
  updateProxy: (proxy: Partial<ProxySettings>) => void;
  updateScanDefaults: (scan: Partial<ScanDefaults>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  immer((set, get) => ({
    settings: { ...defaultSettings },
    isInitialized: false,
    isLoading: false,
    isSaving: false,
    error: null,

    loadSettings: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const raw = await invoke<string>("get_settings");
        const parsed = JSON.parse(raw) as Partial<GeoSettings>;
        set((state) => {
          state.settings = {
            ...defaultSettings,
            ...parsed,
            proxy: {
              ...defaultSettings.proxy,
              ...(parsed.proxy || {}),
            },
            scan: {
              ...defaultSettings.scan,
              ...(parsed.scan || {}),
            },
          };
          state.isInitialized = true;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.settings = { ...defaultSettings };
          state.isInitialized = true;
          state.isLoading = false;
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to load settings";
        });
      }
    },

    saveSettings: async () => {
      set((state) => {
        state.isSaving = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const settings = JSON.stringify(get().settings);
        await invoke<void>("update_settings", { settings });
        set((state) => {
          state.isSaving = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to save settings";
          state.isSaving = false;
        });
      }
    },

    updateOpenaiApiKey: (key: string) => {
      set((state) => {
        state.settings.openaiApiKey = key;
      });
    },

    updatePerplexityApiKey: (key: string) => {
      set((state) => {
        state.settings.perplexityApiKey = key;
      });
    },

    updateGoogleApiKey: (key: string) => {
      set((state) => {
        state.settings.googleApiKey = key;
      });
    },

    updateProxy: (proxy: Partial<ProxySettings>) => {
      set((state) => {
        state.settings.proxy = {
          ...state.settings.proxy,
          ...proxy,
        };
      });
    },

    updateScanDefaults: (scan: Partial<ScanDefaults>) => {
      set((state) => {
        state.settings.scan = {
          ...state.settings.scan,
          ...scan,
        };
      });
    },

    resetSettings: () => {
      set((state) => {
        state.settings = { ...defaultSettings };
      });
    },
  }))
);
