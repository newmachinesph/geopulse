import { memo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

interface EngineComparisonData {
  metric: string;
  chatgpt: number;
  perplexity: number;
  google_aio: number;
}

interface EngineComparisonChartProps {
  data: EngineComparisonData[];
}

export const EngineComparisonChart = memo(function EngineComparisonChart({ data }: EngineComparisonChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Engine Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comparison data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="metric" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey="chatgpt" fill="#10a37f" name="ChatGPT" radius={[4, 4, 0, 0]} />
              <Bar dataKey="perplexity" fill="#20b2aa" name="Perplexity" radius={[4, 4, 0, 0]} />
              <Bar dataKey="google_aio" fill="#4285f4" name="Google AIO" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
});
