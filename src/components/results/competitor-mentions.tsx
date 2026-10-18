import { Badge } from "@/components/ui";

interface CompetitorMentionsProps {
  competitors: string[];
}

export function CompetitorMentions({ competitors }: CompetitorMentionsProps) {
  if (competitors.length === 0) return <p className="text-sm text-muted-foreground">No competitors mentioned</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {competitors.map((c) => <Badge key={c} variant="destructive">{c}</Badge>)}
    </div>
  );
}
