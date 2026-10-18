import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { ACTION_TYPES, ACTION_PRIORITIES } from "@/lib/constants";

interface ActionFiltersProps {
  typeFilter: string;
  priorityFilter: string;
  statusFilter: string;
  onTypeChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

export function ActionFilters({ typeFilter, priorityFilter, statusFilter, onTypeChange, onPriorityChange, onStatusChange }: ActionFiltersProps) {
  return (
    <div className="flex gap-3">
      <Select value={typeFilter} onValueChange={onTypeChange}>
        <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {ACTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-36"><SelectValue placeholder="All Priorities" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          {ACTION_PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="done">Done</SelectItem>
          <SelectItem value="dismissed">Dismissed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
