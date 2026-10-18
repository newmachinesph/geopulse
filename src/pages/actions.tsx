import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout";
import { ProjectSelector } from "@/components/layout/project-selector";
import { ActionItemCard, ActionFilters } from "@/components/actions";
import { Button } from "@/components/ui";
import { IconChecklist, IconTrash } from "@tabler/icons-react";
import { useActionsStore, useProjectsStore } from "@/lib/store";

export default function ActionsPage() {
  const { selectedProjectId } = useProjectsStore();
  const { actions, isLoading, loadActions, updateActionStatus, clearActions } = useActionsStore();

  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (selectedProjectId) {
      loadActions(selectedProjectId);
    }
  }, [selectedProjectId, loadActions]);

  const filteredActions = useMemo(() => {
    return actions.filter((a) => {
      if (typeFilter !== "all" && a.actionType !== typeFilter) return false;
      if (priorityFilter !== "all" && a.priority !== priorityFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    });
  }, [actions, typeFilter, priorityFilter, statusFilter]);

  const handleClear = async () => {
    if (!selectedProjectId) return;
    if (!window.confirm(`Delete all ${actions.length} actions for this project?`)) return;
    try {
      await clearActions(selectedProjectId);
      toast.success("All actions cleared");
    } catch {
      toast.error("Failed to clear actions");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateActionStatus(id, status);
      toast.success(`Action marked as ${status}`);
    } catch {
      toast.error("Failed to update action");
    }
  };

  return (
    <PageLayout title="Action Backlog" subtitle="SEO/GEO tasks prioritized by impact">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <ProjectSelector />
          {actions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isLoading || !selectedProjectId}
              className="text-destructive hover:text-destructive"
            >
              <IconTrash className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        <ActionFilters
          typeFilter={typeFilter}
          priorityFilter={priorityFilter}
          statusFilter={statusFilter}
          onTypeChange={setTypeFilter}
          onPriorityChange={setPriorityFilter}
          onStatusChange={setStatusFilter}
        />

        {filteredActions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <IconChecklist className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No actions yet</h3>
            <p className="text-sm text-muted-foreground">Run scans to generate actionable SEO/GEO recommendations.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActions.map((a) => (
              <ActionItemCard key={a.id} action={a} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
