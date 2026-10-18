import { Card, CardContent, CardHeader, CardTitle, Progress } from "@/components/ui";
import { getEngineLabel, getEngineColor } from "@/lib/utils";
import type { Scan } from "@/lib/types";

interface EngineProgress {
  engine: string;
  completed: number;
}

interface ScanProgressCardProps {
  scan: Scan;
  engineProgress?: EngineProgress[];
}

export function ScanProgressCard({ scan, engineProgress }: ScanProgressCardProps) {
  const pct = scan.totalPrompts > 0 ? (scan.completedPrompts / scan.totalPrompts) * 100 : 0;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Scan Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={pct} className="mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{scan.completedPrompts} / {scan.totalPrompts} prompts — {pct.toFixed(0)}%</span>
        </div>
        {scan.failedPrompts > 0 && <p className="mt-1 text-xs text-destructive">{scan.failedPrompts} failed</p>}

        {engineProgress && engineProgress.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {engineProgress.map((ep) => (
              <div key={ep.engine} className="flex items-center gap-2">
                <span className={`text-xs w-20 truncate ${getEngineColor(ep.engine)}`}>
                  {getEngineLabel(ep.engine)}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all"
                    style={{ width: `${scan.totalPrompts > 0 ? (ep.completed / scan.totalPrompts) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">{ep.completed}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
