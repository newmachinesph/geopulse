import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { IconAlertTriangle } from "@tabler/icons-react";

interface GapItem {
  promptText: string;
  competitors: string[];
  engine: string;
}

export function GapAnalysisCard({ gaps }: { gaps: GapItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><IconAlertTriangle className="h-5 w-5 text-score-medium" />Content Gaps ({gaps.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {gaps.length === 0 ? <p className="text-sm text-muted-foreground">No gaps detected</p> : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {gaps.map((g, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{g.promptText}</p>
                  <Badge variant="outline" className="text-[10px] shrink-0 ml-2">{g.engine}</Badge>
                </div>
                {g.competitors.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Competitors present:</span>
                    {g.competitors.map((c) => <Badge key={c} variant="destructive" className="text-[10px]">{c}</Badge>)}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Brand not mentioned</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
