import { useEffect } from "react";
import { PageLayout } from "@/components/layout";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import { useAlertsStore, useProjectsStore } from "@/lib/store";
import { IconBell, IconBellOff, IconCheck } from "@tabler/icons-react";
import type { AlertSeverity } from "@/lib/types";

const severityOrder: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const severityVariant: Record<AlertSeverity, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
};

export default function AlertsPage() {
  const { selectedProjectId } = useProjectsStore();
  const { alerts, unreadCount, isLoading, loadAlerts, markRead, markAllRead } = useAlertsStore();

  useEffect(() => {
    if (selectedProjectId) {
      loadAlerts(selectedProjectId);
    }
  }, [selectedProjectId, loadAlerts]);

  const sorted = [...alerts].sort((a, b) => {
    const sev = severityOrder[a.severity] - severityOrder[b.severity];
    if (sev !== 0) return sev;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <PageLayout title="Alerts" subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}>
      <div className="space-y-4">
        {alerts.length > 0 && unreadCount > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedProjectId && markAllRead(selectedProjectId)}
            >
              <IconCheck className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          </div>
        )}

        {isLoading && alerts.length === 0 && (
          <p className="text-sm text-muted-foreground p-4">Loading alerts...</p>
        )}

        {!isLoading && alerts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <IconBellOff className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-2">No alerts</h3>
              <p className="text-sm text-muted-foreground">
                Alerts will appear here when scans detect notable changes.
              </p>
            </CardContent>
          </Card>
        )}

        {sorted.length > 0 && (
          <div className="space-y-2">
            {sorted.map((alert) => (
              <Card
                key={alert.id}
                className={`cursor-pointer transition-colors ${!alert.isRead ? "border-primary/30 bg-primary/5" : ""}`}
                onClick={() => !alert.isRead && markRead(alert.id)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <IconBell className={`h-4 w-4 mt-0.5 shrink-0 ${!alert.isRead ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={severityVariant[alert.severity]} className="text-xs">
                        {alert.severity}
                      </Badge>
                      {!alert.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
