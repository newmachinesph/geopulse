import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";
import type { Scan } from "@/lib/types";
import { IconLoader2, IconCircleCheck, IconCircleX, IconClock } from "@tabler/icons-react";

interface RecentScansProps {
  scans: Scan[];
}

function getScanStatusIcon(status: string) {
  switch (status) {
    case "running": return <IconLoader2 className="h-4 w-4 animate-spin text-primary" />;
    case "completed": return <IconCircleCheck className="h-4 w-4 text-positive" />;
    case "failed": return <IconCircleX className="h-4 w-4 text-negative" />;
    default: return <IconClock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getScanStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed": return "default";
    case "running": return "secondary";
    case "failed": return "destructive";
    default: return "outline";
  }
}

export function RecentScans({ scans }: RecentScansProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Recent Scans</CardTitle>
      </CardHeader>
      <CardContent>
        {scans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scans yet. Start your first scan.</p>
        ) : (
          <div className="space-y-3">
            {scans.slice(0, 5).map((scan) => (
              <div key={scan.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getScanStatusIcon(scan.status)}
                  <div>
                    <p className="text-sm font-medium">
                      {scan.totalPrompts} prompts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(scan.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge variant={getScanStatusVariant(scan.status)}>
                  {scan.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
