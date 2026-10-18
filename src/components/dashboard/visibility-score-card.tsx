import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { getScoreColor, getScoreLabel } from "@/lib/utils";

interface VisibilityScoreCardProps {
  score: number;
  previousScore?: number;
  promptCount: number;
}

export function VisibilityScoreCard({ score, previousScore, promptCount }: VisibilityScoreCardProps) {
  const change = previousScore !== undefined ? score - previousScore : 0;
  const changeLabel = change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Visibility Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
            {score.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">/ 5.0</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className={`text-xs font-medium ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </span>
          {previousScore !== undefined && change !== 0 && (
            <span className={`text-xs ${change > 0 ? "text-positive" : "text-negative"}`}>
              {changeLabel}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Based on {promptCount} prompts
        </p>
      </CardContent>
    </Card>
  );
}
