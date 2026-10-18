import { Badge } from "@/components/ui";
import { IconLoader2 } from "@tabler/icons-react";
import type { ScanStatus } from "@/lib/types";

const statusConfig: Record<ScanStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { variant: "outline", label: "Pending" },
  running: { variant: "default", label: "Running" },
  paused: { variant: "secondary", label: "Paused" },
  completed: { variant: "secondary", label: "Completed" },
  failed: { variant: "destructive", label: "Failed" },
  cancelled: { variant: "outline", label: "Cancelled" },
};

export function ScanStatusBadge({ status }: { status: ScanStatus }) {
  const cfg = statusConfig[status];
  return (
    <Badge variant={cfg.variant} className="gap-1">
      {status === "running" && <IconLoader2 className="h-3 w-3 animate-spin" />}
      {cfg.label}
    </Badge>
  );
}
