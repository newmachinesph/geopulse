import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { getScoreVariant } from "@/lib/utils";
import { VISIBILITY_SCORING } from "@/lib/constants";

interface ScoreDisplayProps {
  visibilityScore: number;
  mentionPosition: number | null;
  sentimentLevel: string;
  hasAuthoritativeCitation: boolean;
}

export function ScoreDisplay({ visibilityScore, mentionPosition, sentimentLevel, hasAuthoritativeCitation }: ScoreDisplayProps) {
  const factors = [
    { label: "Top 3 mention", points: mentionPosition !== null && mentionPosition <= 3 ? VISIBILITY_SCORING.topThreeMention : 0, max: VISIBILITY_SCORING.topThreeMention },
    { label: "Mentioned", points: mentionPosition !== null && mentionPosition > 3 ? VISIBILITY_SCORING.mentionOnly : 0, max: VISIBILITY_SCORING.mentionOnly },
    { label: "Positive sentiment", points: sentimentLevel === "positive" || sentimentLevel === "neutral" ? VISIBILITY_SCORING.positiveSentiment : 0, max: VISIBILITY_SCORING.positiveSentiment },
    { label: "Authoritative citation", points: hasAuthoritativeCitation ? VISIBILITY_SCORING.authoritativeCitation : 0, max: VISIBILITY_SCORING.authoritativeCitation },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          Score Breakdown
          <Badge variant={getScoreVariant(visibilityScore)} className="text-lg px-3">{visibilityScore.toFixed(1)} / {VISIBILITY_SCORING.maxScore}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {factors.map((f) => (
            <div key={f.label} className="flex items-center justify-between text-sm">
              <span className={f.points > 0 ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
              <span className={f.points > 0 ? "text-primary font-medium" : "text-muted-foreground"}>+{f.points}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
