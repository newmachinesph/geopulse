import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjectsStore } from "@/lib/store";

export function ProjectSelector() {
  const { projects, selectedProjectId, loadProjects, selectProject } =
    useProjectsStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Auto-select first project if none selected
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      selectProject(projects[0].id);
    }
  }, [projects, selectedProjectId, selectProject]);

  if (projects.length === 0) return null;

  return (
    <Select value={selectedProjectId ?? ""} onValueChange={selectProject}>
      <SelectTrigger id="project-selector" className="w-[220px]">
        <SelectValue placeholder="Select project" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
