import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout";
import { ProjectSelector } from "@/components/layout/project-selector";
import { PromptList, IntentCategoryFilter, PromptEditor } from "@/components/prompts";
import { Button } from "@/components/ui";
import { usePromptsStore, useProjectsStore } from "@/lib/store";
import type { IntentCategory } from "@/lib/types";
import { IconMessageCirclePlus, IconSparkles, IconTrash, IconCheckbox, IconSquare } from "@tabler/icons-react";

export default function PromptsListPage() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [intentFilter, setIntentFilter] = useState<IntentCategory | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { selectedProjectId } = useProjectsStore();
  const { prompts, isLoading, isGenerating, loadPrompts, createPrompt, generatePrompts, clearPrompts, deletePromptsByIds } = usePromptsStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedProjectId) {
      loadPrompts(selectedProjectId);
    }
  }, [selectedProjectId, loadPrompts]);

  const filtered = intentFilter
    ? prompts.filter((p) => p.intentCategory === intentFilter)
    : prompts;

  const handleGenerate = async () => {
    if (!selectedProjectId) {
      toast.error("Select a project first");
      return;
    }
    try {
      await generatePrompts(selectedProjectId, "general");
      toast.success("Prompts generated");
    } catch {
      toast.error("Failed to generate prompts");
    }
  };

  const handleClear = async () => {
    if (!selectedProjectId) return;
    if (!window.confirm(`Delete all ${prompts.length} prompts for this project?`)) return;
    try {
      await clearPrompts(selectedProjectId);
      toast.success("All prompts cleared");
    } catch {
      toast.error("Failed to clear prompts");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected prompt${selectedIds.size !== 1 ? "s" : ""}?`)) return;
    try {
      await deletePromptsByIds(Array.from(selectedIds));
      toast.success(`${selectedIds.size} prompts deleted`);
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch {
      toast.error("Failed to delete prompts");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map((p) => p.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  return (
    <PageLayout
      title="Prompts"
      subtitle="Manage prompts for AI visibility scanning"
      action={{ label: "Add Prompt", onClick: () => setEditorOpen(true) }}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <ProjectSelector />
          <div className="flex items-center gap-2">
            {selectMode ? (
              <>
                <span className="text-xs text-muted-foreground">
                  {selectedIds.size} selected
                </span>
                <Button variant="outline" size="sm" onClick={selectedIds.size === filtered.length ? deselectAll : selectAll}>
                  {selectedIds.size === filtered.length ? "Deselect All" : "Select All"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.size === 0 || isLoading}
                  className="text-destructive hover:text-destructive"
                >
                  <IconTrash className="h-4 w-4" />
                  Delete Selected
                </Button>
                <Button variant="ghost" size="sm" onClick={exitSelectMode}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {prompts.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectMode(true)}
                    >
                      <IconCheckbox className="h-4 w-4" />
                      Select
                    </Button>
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
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedProjectId}
                >
                  <IconSparkles className="h-4 w-4" />
                  {isGenerating ? "Generating..." : "Generate Prompts"}
                </Button>
              </>
            )}
          </div>
        </div>

        <IntentCategoryFilter selected={intentFilter} onSelect={setIntentFilter} />

        {filtered.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <IconMessageCirclePlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No prompts yet</h3>
            <p className="text-sm text-muted-foreground">Add prompts manually or generate them with AI.</p>
          </div>
        ) : selectMode ? (
          <div className="space-y-1">
            {filtered.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  selectedIds.has(p.id) ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50"
                }`}
                onClick={() => toggleSelect(p.id)}
              >
                {selectedIds.has(p.id) ? (
                  <IconCheckbox className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <IconSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{p.text}</p>
                  <span className="text-xs text-muted-foreground">{p.intentCategory}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PromptList prompts={filtered} onSelect={(id) => navigate(`/prompts/${id}`)} />
        )}
      </div>

      <PromptEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSubmit={async (data) => {
          try {
            await createPrompt({
              projectId: selectedProjectId ?? "",
              text: data.text,
              intentCategory: data.intentCategory,
              tags: data.tags,
            });
            toast.success("Prompt created");
          } catch {
            toast.error("Failed to create prompt");
          }
        }}
      />
    </PageLayout>
  );
}
