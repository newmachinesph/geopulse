import { Badge } from "@/components/ui";
import { getScoreVariant } from "@/lib/utils";

export function PromptScoreBadge({ score }: { score: number }) {
  return <Badge variant={getScoreVariant(score)}>{score.toFixed(1)}</Badge>;
}
