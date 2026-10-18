import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout";
import { CardGridSkeleton } from "@/components/layout/loading-skeleton";
import { ProjectCard, CreateProjectDialog } from "@/components/projects";
import { useProjectsStore } from "@/lib/store";
import { IconFolderPlus } from "@tabler/icons-react";

export default function ProjectsListPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { projects, isLoading, loadProjects, createProject } = useProjectsStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <PageLayout
      title="Projects"
      subtitle="Manage your GEO monitoring projects"
      action={{ label: "New Project", onClick: () => setDialogOpen(true) }}
    >
      {isLoading && projects.length === 0 ? (
        <CardGridSkeleton count={3} />
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <IconFolderPlus className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first project to start monitoring brand visibility in AI answers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (input) => {
          try {
            await createProject(input);
            toast.success("Project created");
          } catch {
            toast.error("Failed to create project");
          }
        }}
      />
    </PageLayout>
  );
}
