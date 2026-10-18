import { Card, CardContent, Badge } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import type { ActionItem } from "@/lib/types";
import { ActionTypeIcon } from "./action-type-icon";
import { PriorityBadge } from "./priority-badge";

interface ActionItemCardProps {
  action: ActionItem;
  onStatusChange: (id: string, status: string) => void;
}

export function ActionItemCard({ action, onStatusChange }: ActionItemCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <ActionTypeIcon type={action.actionType} />
            <div className="min-w-0">
              <p className="font-medium text-sm">{action.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <PriorityBadge priority={action.priority} />
                <Badge variant="secondary">Impact: {action.impactScore}/10</Badge>
                {action.relatedEngine && <Badge variant="outline">{action.relatedEngine}</Badge>}
              </div>
            </div>
          </div>
          <Select value={action.status} onValueChange={(v) => onStatusChange(action.id, v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
