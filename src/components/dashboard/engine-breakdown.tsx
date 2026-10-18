import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { getEngineLabel, getEngineColor, getScoreColor } from "@/lib/utils";
import { AI_ENGINES } from "@/lib/constants";

interface EngineScore {
  engine: string;
  avgScore: number;
  mentionRate: number;
  promptCount: number;
}

interface EngineBreakdownProps {
  engines: EngineScore[];
}

export function EngineBreakdown({ engines }: EngineBreakdownProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Engine Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {AI_ENGINES.map((eng) => {
            const data = engines.find((e) => e.engine === eng.value);
            const score = data?.avgScore ?? 0;
            const rate = data?.mentionRate ?? 0;
            return (
              <div key={eng.value}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${getEngineColor(eng.value)}`}>
                    {eng.label}
                  </span>
                  <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                    {score.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(rate * 100).toFixed(0)}% mention rate
                </p>
              </div>
            );
          })}
          {engines.length === 0 && (
            <p className="text-sm text-muted-foreground">No scan data yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
