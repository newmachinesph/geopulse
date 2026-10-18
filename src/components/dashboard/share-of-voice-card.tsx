import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

interface ShareOfVoiceProps {
  brandShare: number;
  competitors: { name: string; share: number }[];
}

export function ShareOfVoiceCard({ brandShare, competitors }: ShareOfVoiceProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Share of Voice</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            {(brandShare * 100).toFixed(0)}%
          </span>
        </div>
        {competitors.length > 0 && (
          <div className="mt-3 space-y-2">
            {competitors.map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{c.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-muted-foreground/50"
                      style={{ width: `${c.share * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(c.share * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {competitors.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            No competitor data yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
