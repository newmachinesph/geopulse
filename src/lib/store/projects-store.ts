import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from "@/lib/types";
import { getInvoke } from "./tauri-helpers";

interface ProjectsState {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface ProjectsActions {
  loadProjects: () => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<void>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<void>;
  deleteProjectById: (id: string) => Promise<void>;
  selectProject: (id: string | null) => void;
}

export const useProjectsStore = create<ProjectsState & ProjectsActions>()(
  immer((set) => ({
    projects: [],
    selectedProjectId: null,
    isLoading: false,
    error: null,

    loadProjects: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const projects = await invoke<Project[]>("get_all_projects");
        set((state) => {
          state.projects = projects;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to load projects";
          state.isLoading = false;
        });
      }
    },

    createProject: async (input: CreateProjectInput) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const project = await invoke<Project>("create_project", { input });
        set((state) => {
          state.projects.push(project);
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to create project";
          state.isLoading = false;
        });
      }
    },

    updateProject: async (id: string, input: UpdateProjectInput) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        const updated = await invoke<Project | null>("update_project", {
          id,
          input,
        });
        if (updated) {
          set((state) => {
            const index = state.projects.findIndex((p) => p.id === id);
            if (index !== -1) {
              state.projects[index] = updated;
            }
            state.isLoading = false;
          });
        }
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to update project";
          state.isLoading = false;
        });
      }
    },

    deleteProjectById: async (id: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const invoke = await getInvoke();
        await invoke<boolean>("delete_project", { id });
        set((state) => {
          state.projects = state.projects.filter((p) => p.id !== id);
          if (state.selectedProjectId === id) {
            state.selectedProjectId = null;
          }
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error
              ? error.message
              : "Failed to delete project";
          state.isLoading = false;
        });
      }
    },

    selectProject: (id: string | null) => {
      set((state) => {
        state.selectedProjectId = id;
      });
    },
  }))
);
