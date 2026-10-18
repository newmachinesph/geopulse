import { useEffect, useState, useRef } from "react";
import { IconSearch, IconBell, IconPlus, IconCheck } from "@tabler/icons-react";
import { Button, Input, Badge } from "@/components/ui";
import { useAlertsStore, useProjectsStore } from "@/lib/store";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const { selectedProjectId } = useProjectsStore();
  const { alerts, unreadCount, loadAlerts, markRead, markAllRead } = useAlertsStore();
  const [showAlerts, setShowAlerts] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedProjectId) {
      loadAlerts(selectedProjectId);
    }
  }, [selectedProjectId, loadAlerts]);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAlerts(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div id="header-search" className="relative">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 pl-9"
          />
        </div>

        <div id="header-alerts" className="relative" ref={dropdownRef}>
          <Button variant="ghost" size="icon" onClick={() => setShowAlerts(!showAlerts)}>
            <IconBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {showAlerts && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-popover shadow-lg z-50">
              <div className="flex items-center justify-between border-b p-3">
                <span className="text-sm font-semibold">Alerts</span>
                {unreadCount > 0 && selectedProjectId && (
                  <Button variant="ghost" size="sm" onClick={() => markAllRead(selectedProjectId)}>
                    <IconCheck className="h-3 w-3" />
                    Mark all read
                  </Button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">No alerts</p>
                ) : (
                  alerts.slice(0, 10).map((alert) => (
                    <div
                      key={alert.id}
                      className={`border-b p-3 text-sm cursor-pointer hover:bg-accent ${!alert.isRead ? "bg-accent/50" : ""}`}
                      onClick={() => markRead(alert.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"} className="text-[10px]">
                          {alert.severity}
                        </Badge>
                        <span className="font-medium truncate">{alert.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {action && (
          <Button onClick={action.onClick}>
            <IconPlus className="h-4 w-4" />
            {action.label}
          </Button>
        )}
      </div>
    </header>
  );
}
