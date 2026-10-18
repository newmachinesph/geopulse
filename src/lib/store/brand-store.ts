import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { BrandProfile, Persona, CreatePersonaInput } from "@/lib/types";
import { getInvoke } from "./tauri-helpers";

interface BrandState {
  brandProfile: BrandProfile | null;
  personas: Persona[];
  isLoading: boolean;
  isSaving: boolean;
  isValidating: boolean;
  isGeneratingPersonas: boolean;
  validationResult: string | null;
  error: string | null;
}

export interface BrandAutofillResult {
  entityName: string;
  aliases: string[];
  competitors: string[];
  targetKeywords: string[];
}

interface BrandActions {
  loadBrandProfile: (projectId: string) => Promise<void>;
  saveBrandProfile: (input: {
    projectId: string;
    entityName: string;
    aliases: string;
    competitors: string;
    targetKeywords: string;
  }) => Promise<void>;
  validateBrand: (projectId: string) => Promise<void>;
  autofillBrandProfile: (projectId: string) => Promise<BrandAutofillResult>;
  loadPersonas: (projectId: string) => Promise<void>;
  createPersona: (input: CreatePersonaInput) => Promise<void>;
  deletePersona: (id: string) => Promise<void>;
  clearPersonas: (projectId: string) => Promise<void>;
  generatePersonas: (projectId: string) => Promise<void>;
}

export const useBrandStore = create<BrandState & BrandActions>()(
  immer((set) => ({
    brandProfile: null,
    personas: [],
    isLoading: false,
    isSaving: false,
    isValidating: false,
    isGeneratingPersonas: false,
    validationResult: null,
    error: null,

    loadBrandProfile: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const profile = await invoke<BrandProfile | null>(
          "get_brand_profile",
          { projectId }
        );
        set((state) => {
          state.brandProfile = profile;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to load brand profile";
          state.isLoading = false;
        });
      }
    },

    saveBrandProfile: async (input) => {
      set((state) => {
        state.isSaving = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const profile = await invoke<BrandProfile>("save_brand_profile", {
          input,
        });
        set((state) => {
          state.brandProfile = profile;
          state.isSaving = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to save brand profile";
          state.isSaving = false;
        });
      }
    },

    validateBrand: async (projectId: string) => {
      set((state) => {
        state.isValidating = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const result = await invoke<string>("validate_brand_entity", {
          projectId,
        });
        set((state) => {
          state.validationResult = result;
          state.isValidating = false;
        });
        // Reload brand profile to get updated validation_data
        const profile = await (await getInvoke())<BrandProfile | null>(
          "get_brand_profile",
          { projectId }
        );
        set((state) => {
          state.brandProfile = profile;
        });
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "Failed to validate brand";
        set((state) => {
          state.error = msg;
          state.isValidating = false;
        });
        throw new Error(msg);
      }
    },

    autofillBrandProfile: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const result = await invoke<BrandAutofillResult>(
          "autofill_brand_profile",
          { projectId }
        );
        set((state) => {
          state.isLoading = false;
        });
        return result;
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "Failed to autofill brand profile";
        set((state) => {
          state.error = msg;
          state.isLoading = false;
        });
        throw new Error(msg);
      }
    },

    loadPersonas: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const personas = await invoke<Persona[]>("get_personas", {
          projectId,
        });
        set((state) => {
          state.personas = personas;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to load personas";
          state.isLoading = false;
        });
      }
    },

    createPersona: async (input: CreatePersonaInput) => {
      set((state) => {
        state.isSaving = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const persona = await invoke<Persona>("create_persona", { input });
        set((state) => {
          state.personas.push(persona);
          state.isSaving = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to create persona";
          state.isSaving = false;
        });
      }
    },

    deletePersona: async (id: string) => {
      set((state) => {
        state.isSaving = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        await invoke<boolean>("delete_persona", { id });
        set((state) => {
          state.personas = state.personas.filter((p) => p.id !== id);
          state.isSaving = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to delete persona";
          state.isSaving = false;
        });
      }
    },

    clearPersonas: async (projectId: string) => {
      try {
        const invoke = await getInvoke();
        await invoke<number>("clear_personas", { projectId });
        set((state) => {
          state.personas = [];
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to clear personas";
        });
      }
    },

    generatePersonas: async (projectId: string) => {
      set((state) => {
        state.isGeneratingPersonas = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const personas = await invoke<Persona[]>("generate_personas", {
          projectId,
        });
        set((state) => {
          state.personas = [...state.personas, ...personas];
          state.isGeneratingPersonas = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to generate personas";
          state.isGeneratingPersonas = false;
        });
      }
    },
  }))
);
