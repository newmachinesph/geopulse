import { useState } from "react";
import { toast } from "sonner";
import { Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { compareScans } from "@/lib/tauri/commands";
import type { Scan, ScanComparison } from "@/lib/types";
import { getScoreVariant } from "@/lib/utils";
import { IconGitCompare, IconArrowUp, IconArrowDown, IconMinus } from "@tabler/icons-react";

interface ScanComparisonDialogProps {
  scans: Scan[];
}

export function ScanComparisonDialog({ scans }: ScanComparisonDialogProps) {
  const [beforeId, setBeforeId] = useState<string>("");
  const [afterId, setAfterId] = useState<string>("");
  const [comparison, setComparison] = useState<ScanComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const completedScans = scans.filter((s) => s.status === "completed");

  const handleCompare = async () => {
    if (!beforeId || !afterId) {
      toast.error("Select two scans to compare");
      return;
    }
    if (beforeId === afterId) {
      toast.error("Select two different scans");
      return;
    }
    setIsLoading(true);
    try {
      const result = await compareScans(beforeId, afterId);
      setComparison(result);
    } catch (error) {
      toast.error("Failed to compare scans");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDelta = (delta: number) => {
    if (delta > 0) return `+${delta.toFixed(2)}`;
    return delta.toFixed(2);
  };

  const DeltaIcon = ({ delta }: { delta: number }) => {
    if (delta > 0) return <IconArrowUp className="h-4 w-4 text-green-500 inline" />;
    if (delta < 0) return <IconArrowDown className="h-4 w-4 text-red-500 inline" />;
    return <IconMinus className="h-4 w-4 text-muted-foreground inline" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Before (older)</label>
          <select
            value={beforeId}
            onChange={(e) => setBeforeId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select scan...</option>
            {completedScans.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.createdAt).toLocaleDateString()} — {s.completedPrompts}/{s.totalPrompts} prompts
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-1 block">After (newer)</label>
          <select
            value={afterId}
            onChange={(e) => setAfterId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select scan...</option>
            {completedScans.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.createdAt).toLocaleDateString()} — {s.completedPrompts}/{s.totalPrompts} prompts
              </option>
            ))}
          </select>
        </div>
        <Button onClick={handleCompare} disabled={isLoading || !beforeId || !afterId}>
          <IconGitCompare className="h-4 w-4" />
          {isLoading ? "Comparing..." : "Compare"}
        </Button>
      </div>

      {comparison && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Avg Visibility Score</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold">{comparison.avgScoreBefore.toFixed(2)}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-lg font-bold">{comparison.avgScoreAfter.toFixed(2)}</span>
                <Badge variant={comparison.avgScoreDelta >= 0 ? "default" : "destructive"}>
                  <DeltaIcon delta={comparison.avgScoreDelta} />
                  {formatDelta(comparison.avgScoreDelta)}
                </Badge>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Mention Rate</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold">{(comparison.mentionRateBefore * 100).toFixed(0)}%</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-lg font-bold">{(comparison.mentionRateAfter * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Prompts Compared</p>
              <p className="text-lg font-bold mt-1">{comparison.results.length}</p>
            </div>
          </div>

          {/* Detailed results table */}
          {comparison.results.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Engine</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Before</TableHead>
                  <TableHead>After</TableHead>
                  <TableHead>Delta</TableHead>
                  <TableHead>Sentiment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="capitalize">{r.engine}</TableCell>
                    <TableCell className="uppercase">{r.market}</TableCell>
                    <TableCell>
                      <Badge variant={getScoreVariant(r.beforeScore)}>{r.beforeScore.toFixed(1)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getScoreVariant(r.afterScore)}>{r.afterScore.toFixed(1)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={r.scoreDelta > 0 ? "text-green-500" : r.scoreDelta < 0 ? "text-red-500" : "text-muted-foreground"}>
                        <DeltaIcon delta={r.scoreDelta} /> {formatDelta(r.scoreDelta)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{r.beforeSentiment} → {r.afterSentiment}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
