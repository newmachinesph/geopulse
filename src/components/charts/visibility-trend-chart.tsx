import { memo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

interface TrendDataPoint {
  date: string;
  chatgpt?: number;
  perplexity?: number;
  google_aio?: number;
}

interface VisibilityTrendChartProps {
  data: TrendDataPoint[];
}

export const VisibilityTrendChart = memo(function VisibilityTrendChart({ data }: VisibilityTrendChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Visibility Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trend data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
              <YAxis domain={[0, 5]} stroke="#71717a" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                labelStyle={{ color: "#fafafa" }}
              />
              <Legend />
              <Line type="monotone" dataKey="chatgpt" stroke="#10a37f" strokeWidth={2} name="ChatGPT" dot={false} />
              <Line type="monotone" dataKey="perplexity" stroke="#20b2aa" strokeWidth={2} name="Perplexity" dot={false} />
              <Line type="monotone" dataKey="google_aio" stroke="#4285f4" strokeWidth={2} name="Google AIO" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
});
