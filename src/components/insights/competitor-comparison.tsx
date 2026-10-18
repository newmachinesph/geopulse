import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { getScoreColor } from "@/lib/utils";

interface CompetitorData {
  name: string;
  avgScore: number;
  mentionRate: number;
}

export function CompetitorComparison({ brand, competitors }: { brand: CompetitorData; competitors: CompetitorData[] }) {
  const all = [brand, ...competitors].sort((a, b) => b.avgScore - a.avgScore);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Competitor Comparison</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {all.map((c) => {
            const isBrand = c.name === brand.name;
            const nameClass = isBrand ? "text-sm font-medium text-primary" : "text-sm font-medium text-foreground";
            const scoreClass = "text-sm font-bold " + getScoreColor(c.avgScore);
            const barClass = isBrand ? "h-full rounded-full bg-primary" : "h-full rounded-full bg-muted-foreground/50";
            const widthPct = ((c.avgScore / 5) * 100) + "%";
            return (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className={nameClass}>{c.name}{isBrand ? " (You)" : ""}</span>
                  <span className={scoreClass}>{c.avgScore.toFixed(1)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={barClass} style={{ width: widthPct }} />
                </div>
              </div>
            );
          })}
          {competitors.length === 0 && <p className="text-sm text-muted-foreground">No competitor data yet</p>}
        </div>
      </CardContent>
    </Card>
  );
}
