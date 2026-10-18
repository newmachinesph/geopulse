import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from "@/components/ui";
import { getScoreColor, getScoreVariant } from "@/lib/utils";
import { MARKETS } from "@/lib/constants";

interface MarketScore {
  market: string;
  avgScore: number;
  mentionRate: number;
}

interface MarketOverviewProps {
  markets: MarketScore[];
}

export function MarketOverview({ markets }: MarketOverviewProps) {
  if (markets.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Markets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No market data yet. Run a scan to see results.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Markets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {markets.map((m) => {
            const marketInfo = MARKETS.find((mk) => mk.value === m.market);
            return (
              <div key={m.market} className="flex items-center justify-between">
                <span className="text-sm">{marketInfo?.label ?? m.market}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={getScoreVariant(m.avgScore)}>
                    {m.avgScore.toFixed(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {(m.mentionRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
