import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout";
import { EngineTabs, ScanResultsTable, ScanProgressCard, ResultDetailSheet, ResultFilters } from "@/components/scans";
import type { ResultFilterValues } from "@/components/scans";
import { Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui";
import { useScansStore, useResultsStore } from "@/lib/store";
import { exportResultsCsv, exportResultsJson, exportResultsTsv } from "@/lib/export";
import { IconDownload } from "@tabler/icons-react";

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { scans, refreshScan } = useScansStore();
  const { results, isLoading, loadResults } = useResultsStore();
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  const [filters, setFilters] = useState<ResultFilterValues>({
    mentioned: "all",
    sentiment: "all",
    scoreMin: "",
    scoreMax: "",
  });

  const selectedResult = selectedResultId ? results.find((r) => r.id === selectedResultId) ?? null : null;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (filters.mentioned === "yes" && !r.brandMentioned) return false;
      if (filters.mentioned === "no" && r.brandMentioned) return false;
      if (filters.sentiment !== "all" && r.sentimentLevel !== filters.sentiment) return false;
      const min = filters.scoreMin !== "" ? parseFloat(filters.scoreMin) : null;
      const max = filters.scoreMax !== "" ? parseFloat(filters.scoreMax) : null;
      if (min != null && !isNaN(min) && r.visibilityScore < min) return false;
      if (max != null && !isNaN(max) && r.visibilityScore > max) return false;
      return true;
    });
  }, [results, filters]);

  // Per-engine progress derived from loaded results
  const engineProgress = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of results) {
      counts.set(r.engine, (counts.get(r.engine) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([engine, completed]) => ({ engine, completed }))
      .sort((a, b) => b.completed - a.completed);
  }, [results]);

  const scan = scans.find((s) => s.id === id);

  useEffect(() => {
    if (id) {
      loadResults(id);
      refreshScan(id);
    }
  }, [id, loadResults, refreshScan]);

  // Poll while scan is running
  useEffect(() => {
    if (!id) return;
    const isRunning = scan?.status === "running" || scan?.status === "pending";
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        refreshScan(id);
        loadResults(id);
      }, 3000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [id, scan?.status, refreshScan, loadResults]);

  return (
    <PageLayout
      title="Scan Results"
      subtitle={scan ? `${new Date(scan.createdAt).toLocaleDateString()} — ${scan.status}` : `Scan ${id}`}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {scan && <ScanProgressCard scan={scan} engineProgress={engineProgress} />}
          {results.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconDownload className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { exportResultsCsv(results, `scan-${id}-results.csv`); toast.success("CSV exported"); }}>
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { exportResultsJson(results, `scan-${id}-results.json`); toast.success("JSON exported"); }}>
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { exportResultsTsv(results, `scan-${id}-results.tsv`); toast.success("TSV exported"); }}>
                  Export TSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <ResultFilters filters={filters} onChange={setFilters} />

        <EngineTabs>
          {(engine) => {
            if (engine !== selectedEngine) {
              setTimeout(() => setSelectedEngine(engine), 0);
            }
            const displayResults = engine
              ? filteredResults.filter((r) => r.engine === engine)
              : filteredResults;
            return (
              <div className="mt-4">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground p-4">Loading results...</p>
                ) : (
                  <ScanResultsTable
                    results={displayResults}
                    onSelect={(resultId) => setSelectedResultId(resultId)}
                  />
                )}
              </div>
            );
          }}
        </EngineTabs>

        <ResultDetailSheet
          result={selectedResult}
          open={selectedResultId !== null}
          onOpenChange={(open) => { if (!open) setSelectedResultId(null); }}
        />
      </div>
    </PageLayout>
  );
}
