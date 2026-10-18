import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout";
import { BrandConfigForm, BrandValidationCard, PersonaSection } from "@/components/projects";
import { Tabs, TabsList, TabsTrigger, TabsContent, Card, CardContent, Badge, Button } from "@/components/ui";
import { IconTrash, IconSparkles } from "@tabler/icons-react";
import {
  useProjectsStore,
  useBrandStore,
  usePromptsStore,
  useScansStore,
} from "@/lib/store";
import type { BrandValidationResult } from "@/lib/types";

export default function ProjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { projects, deleteProjectById } = useProjectsStore();
  const {
    brandProfile, personas,
    isLoading: isBrandLoading, isValidating, isGeneratingPersonas,
    loadBrandProfile, saveBrandProfile, validateBrand, autofillBrandProfile,
    loadPersonas, generatePersonas, clearPersonas,
  } = useBrandStore();
  const { prompts, isGenerating, loadPrompts, generatePrompts, createPrompt, clearPrompts } = usePromptsStore();
  const { scans, loadScans, clearScans } = useScansStore();

  const project = projects.find((p) => p.id === id);

  useEffect(() => {
    if (id) {
      loadBrandProfile(id);
      loadPersonas(id);
      loadPrompts(id);
      loadScans(id);
    }
  }, [id, loadBrandProfile, loadPersonas, loadPrompts, loadScans]);

  // Parse validation data from brand profile if available
  const validation = useMemo<BrandValidationResult | null>(() => {
    if (brandProfile?.validationData) {
      try {
        return JSON.parse(brandProfile.validationData);
      } catch {
        return null;
      }
    }
    return null;
  }, [brandProfile?.validationData]);

  const handleSaveBrand = async (data: { entityName: string; aliases: string; competitors: string; targetKeywords: string }) => {
    if (!id) return;
    try {
      await saveBrandProfile({ projectId: id, ...data });
      toast.success("Brand profile saved");
    } catch {
      toast.error("Failed to save brand profile");
    }
  };

  const handleAutofill = async () => {
    if (!id) throw new Error("No project selected");
    const result = await autofillBrandProfile(id);
    return result;
  };

  const handleValidate = async () => {
    if (!id) return;
    try {
      await validateBrand(id);
      toast.success("Brand validation complete");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Validation failed");
    }
  };

  const handleGeneratePersonas = async () => {
    if (!id) return;
    try {
      await generatePersonas(id);
      toast.success("Personas generated");
    } catch {
      toast.error("Failed to generate personas");
    }
  };

  const handleUsePersonaPrompts = async (samplePrompts: { text: string; intentCategory: string }[]) => {
    if (!id || samplePrompts.length === 0) return;
    try {
      for (const sp of samplePrompts) {
        await createPrompt({
          projectId: id,
          text: sp.text,
          intentCategory: sp.intentCategory || "informational",
          tags: "[]",
        });
      }
      toast.success(`${samplePrompts.length} prompts added`);
    } catch {
      toast.error("Failed to add prompts");
    }
  };

  const handleGeneratePromptsAI = async () => {
    if (!id) return;
    try {
      await generatePrompts(id, "all");
      toast.success("Prompts generated via AI");
    } catch {
      toast.error("Failed to generate prompts");
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!id) return;
    setIsRefreshing(true);
    try {
      await validateBrand(id);
      toast.success("Brand validation refreshed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Validation failed");
    } finally {
      setIsRefreshing(false);
    }
  }, [id, validateBrand]);

  const handleDeleteProject = async () => {
    if (!id) return;
    if (!window.confirm("Delete this project and all its data? This cannot be undone.")) return;
    try {
      await deleteProjectById(id);
      toast.success("Project deleted");
      navigate("/");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const handleClearPersonas = async () => {
    if (!id || personas.length === 0) return;
    if (!window.confirm(`Delete all ${personas.length} personas?`)) return;
    try {
      await clearPersonas(id);
      toast.success("All personas deleted");
    } catch {
      toast.error("Failed to delete personas");
    }
  };

  const handleClearPrompts = async () => {
    if (!id || prompts.length === 0) return;
    if (!window.confirm(`Delete all ${prompts.length} prompts?`)) return;
    try {
      await clearPrompts(id);
      toast.success("All prompts deleted");
    } catch {
      toast.error("Failed to delete prompts");
    }
  };

  const handleClearScans = async () => {
    if (!id || scans.length === 0) return;
    if (!window.confirm(`Delete all ${scans.length} scans and their results?`)) return;
    try {
      await clearScans(id);
      toast.success("All scans deleted");
    } catch {
      toast.error("Failed to delete scans");
    }
  };

  const sortedPrompts = useMemo(
    () => [...prompts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [prompts]
  );

  const entityName = brandProfile?.entityName ?? project?.brandName ?? "";

  return (
    <PageLayout title={project?.name ?? "Project Details"} subtitle={project?.siteUrl ?? ""}>
      <Tabs defaultValue="overview">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="brand">Brand</TabsTrigger>
            <TabsTrigger value="personas">Personas</TabsTrigger>
            <TabsTrigger value="prompts">Prompts ({prompts.length})</TabsTrigger>
            <TabsTrigger value="scans">Scans ({scans.length})</TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="icon" onClick={handleDeleteProject} title="Delete project" className="text-destructive hover:text-destructive">
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Prompts</p>
                <p className="text-2xl font-bold">{prompts.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Scans</p>
                <p className="text-2xl font-bold">{scans.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Personas</p>
                <p className="text-2xl font-bold">{personas.length}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config">
          <div className="mt-4">
            <BrandConfigForm
              entityName={brandProfile?.entityName ?? project?.brandName ?? ""}
              aliases={brandProfile?.aliases ?? ""}
              competitors={brandProfile?.competitors ?? ""}
              targetKeywords={brandProfile?.targetKeywords ?? ""}
              onSave={handleSaveBrand}
              onAutofill={handleAutofill}
              isAutofilling={isBrandLoading}
            />
          </div>
        </TabsContent>

        {/* Brand Tab */}
        <TabsContent value="brand">
          <div className="mt-4">
            <BrandValidationCard
              entityName={entityName}
              validation={validation}
              isValidating={isValidating || isRefreshing}
              onValidate={handleValidate}
              onRefresh={handleRefresh}
            />
          </div>
        </TabsContent>

        {/* Personas Tab */}
        <TabsContent value="personas">
          <div className="mt-4 space-y-4">
            {personas.length > 0 && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleClearPersonas} className="text-destructive hover:text-destructive">
                  <IconTrash className="h-3.5 w-3.5 mr-1" />
                  Delete All
                </Button>
              </div>
            )}
            <PersonaSection
              personas={personas.map((p) => {
                const demographics = tryParseJson(p.demographics);
                const searchBehavior = tryParseJson(p.searchBehavior);
                return {
                  id: p.id,
                  projectId: p.projectId,
                  name: p.name,
                  age: demographics?.age ?? 30,
                  bio: p.description || demographics?.bio || "",
                  painPoints: searchBehavior?.painPoints ?? [],
                  samplePrompts: searchBehavior?.samplePrompts ?? [],
                  createdAt: p.createdAt,
                };
              })}
              isGenerating={isGeneratingPersonas}
              onGenerate={handleGeneratePersonas}
              onUsePrompts={handleUsePersonaPrompts}
            />
          </div>
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts">
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{prompts.length} prompt{prompts.length !== 1 ? "s" : ""}</p>
              <div className="flex items-center gap-2">
                {prompts.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleClearPrompts} className="text-destructive hover:text-destructive">
                    <IconTrash className="h-3.5 w-3.5 mr-1" />
                    Delete All
                  </Button>
                )}
                <Button onClick={handleGeneratePromptsAI} disabled={isGenerating} size="sm">
                  <IconSparkles className="h-4 w-4 mr-1" />
                  {isGenerating ? "Generating..." : "Generate via AI"}
                </Button>
              </div>
            </div>
            {sortedPrompts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <h3 className="text-lg font-semibold mb-2">No prompts yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate prompts via AI or add them from personas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {sortedPrompts.map((prompt) => (
                  <Card key={prompt.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{prompt.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {prompt.intentCategory}
                          </Badge>
                          <Badge
                            variant={prompt.status === "active" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {prompt.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>Score: {prompt.avgScore.toFixed(1)}</div>
                        <div>Runs: {prompt.runCount}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Scans Tab */}
        <TabsContent value="scans">
          <div className="mt-4 space-y-4">
            {scans.length > 0 && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleClearScans} className="text-destructive hover:text-destructive">
                  <IconTrash className="h-3.5 w-3.5 mr-1" />
                  Delete All
                </Button>
              </div>
            )}
            {scans.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <h3 className="text-lg font-semibold mb-2">No scans yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a scan from the Scans page.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {scans.map((scan) => (
                  <Card key={scan.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(scan.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {scan.completedPrompts}/{scan.totalPrompts} completed
                          {scan.failedPrompts > 0 && ` (${scan.failedPrompts} failed)`}
                        </p>
                      </div>
                      <Badge
                        variant={scan.status === "completed" ? "default" : "secondary"}
                      >
                        {scan.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}

function tryParseJson(json: string): any {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}
