import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout";
import { ProjectSelector } from "@/components/layout/project-selector";
import { ScanConfigDialog, ScanStatusBadge, ScanComparisonDialog } from "@/components/scans";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { useScansStore, useProjectsStore } from "@/lib/store";
import { MARKETS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import { IconScanEye, IconPlayerPause, IconPlayerPlay, IconTrash, IconX } from "@tabler/icons-react";

export default function ScansListPage() {
  const [configOpen, setConfigOpen] = useState(false);
  const { selectedProjectId } = useProjectsStore();
  const { scans, isLoading, loadScans, startScan, pauseScan, resumeScan, cancelScan, deleteScan } = useScansStore();
  const navigate = useNavigate();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (selectedProjectId) {
      loadScans(selectedProjectId);
    }
  }, [selectedProjectId, loadScans]);

  // Poll while any scan is running
  const hasRunning = scans.some((s) => s.status === "running" || s.status === "pending");
  useEffect(() => {
    if (hasRunning && selectedProjectId) {
      intervalRef.current = setInterval(() => {
        loadScans(selectedProjectId);
      }, 5000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hasRunning, selectedProjectId, loadScans]);

  const handlePause = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await pauseScan(id);
      toast.success("Scan paused");
    } catch {
      toast.error("Failed to pause scan");
    }
  };

  const handleResume = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await resumeScan(id);
      toast.success("Scan resumed");
    } catch {
      toast.error("Failed to resume scan");
    }
  };

  const handleCancel = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await cancelScan(id);
      toast.success("Scan cancelled");
    } catch {
      toast.error("Failed to cancel scan");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this scan and all its results? This cannot be undone.")) return;
    try {
      await deleteScan(id);
      toast.success("Scan deleted");
    } catch {
      toast.error("Failed to delete scan");
    }
  };

  const completedScans = scans.filter((s) => s.status === "completed");

  return (
    <PageLayout
      title="Scans"
      subtitle="Monitor and manage AI visibility scans"
      action={{ label: "New Scan", onClick: () => setConfigOpen(true) }}
    >
      <div className="space-y-4">
        <ProjectSelector />

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Scans</TabsTrigger>
            <TabsTrigger value="compare" disabled={completedScans.length < 2}>
              Compare {completedScans.length >= 2 && `(${completedScans.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {scans.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <IconScanEye className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No scans yet</h3>
                <p className="text-sm text-muted-foreground">Launch a scan to see how your brand appears in AI-generated answers.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scans.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/scans/${s.id}`)}>
                      <TableCell>{formatRelativeTime(s.createdAt)}</TableCell>
                      <TableCell><ScanStatusBadge status={s.status} /></TableCell>
                      <TableCell>
                        {s.completedPrompts} / {s.totalPrompts} — {s.totalPrompts > 0 ? Math.round((s.completedPrompts / s.totalPrompts) * 100) : 0}%
                      </TableCell>
                      <TableCell className={s.failedPrompts > 0 ? "text-destructive" : ""}>{s.failedPrompts}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {s.status === "running" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handlePause(e, s.id)} title="Pause scan">
                              <IconPlayerPause className="h-4 w-4" />
                            </Button>
                          )}
                          {s.status === "paused" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleResume(e, s.id)} title="Resume scan">
                              <IconPlayerPlay className="h-4 w-4" />
                            </Button>
                          )}
                          {(s.status === "running" || s.status === "pending" || s.status === "paused") && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleCancel(e, s.id)} title="Cancel scan">
                              <IconX className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => handleDelete(e, s.id)} title="Delete scan">
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="compare">
            <div className="mt-4">
              <ScanComparisonDialog scans={scans} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {configOpen && <ScanConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        onLaunch={async (config) => {
          if (!selectedProjectId) {
            toast.error("Select a project first");
            return;
          }
          try {
            const languages = [...new Set(
              config.markets
                .map((m) => MARKETS.find((mk) => mk.value === m)?.language)
                .filter(Boolean) as string[]
            )];
            const fullConfig = { ...config, languages, promptIds: [] };
            await startScan(selectedProjectId, JSON.stringify(fullConfig));
            toast.success("Scan launched");
          } catch {
            toast.error("Failed to launch scan");
          }
        }}
      />}
    </PageLayout>
  );
}
