import { Badge } from "@/components/ui";
import type { Citation } from "@/lib/types";
import { IconExternalLink, IconShield } from "@tabler/icons-react";

interface CitationListProps {
  citations: Citation[];
}

const sourceTypeColors: Record<string, "default" | "positive" | "destructive" | "secondary" | "outline"> = {
  owned: "positive",
  authority: "default",
  earned: "default",
  competitor: "destructive",
  third_party: "secondary",
  neutral: "secondary",
  unknown: "outline",
};

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) return <p className="text-sm text-muted-foreground">No citations found</p>;
  return (
    <div className="space-y-2">
      {citations.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-muted-foreground">#{c.position}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{c.title || c.domain}</p>
              <p className="text-xs text-muted-foreground truncate">{c.url}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={sourceTypeColors[c.sourceType] || "outline"}>{c.sourceType}</Badge>
            {c.isAuthoritative && <IconShield className="h-4 w-4 text-positive" />}
          </div>
        </div>
      ))}
    </div>
  );
}
