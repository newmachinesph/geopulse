import { Badge } from "@/components/ui";

const priorityConfig: Record<string, { variant: "destructive" | "mixed" | "score-medium" | "secondary"; label: string }> = {
  critical: { variant: "destructive", label: "Critical" },
  high: { variant: "mixed", label: "High" },
  medium: { variant: "score-medium", label: "Medium" },
  low: { variant: "secondary", label: "Low" },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const cfg = priorityConfig[priority] ?? { variant: "secondary" as const, label: priority };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
