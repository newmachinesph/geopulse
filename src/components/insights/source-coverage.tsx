import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";

interface SourceGroup {
  type: string;
  count: number;
  domains: string[];
}

export function SourceCoverage({ sources }: { sources: SourceGroup[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Source Coverage</CardTitle></CardHeader>
      <CardContent>
        {sources.length === 0 ? <p className="text-sm text-muted-foreground">No citation data yet</p> : (
          <div className="space-y-3">
            {sources.map((s) => (
              <div key={s.type}>
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="secondary">{s.type}</Badge>
                  <span className="text-xs text-muted-foreground">{s.count} citations</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.domains.slice(0, 5).map((d) => <span key={d} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{d}</span>)}
                  {s.domains.length > 5 && <span className="text-xs text-muted-foreground">+{s.domains.length - 5} more</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
