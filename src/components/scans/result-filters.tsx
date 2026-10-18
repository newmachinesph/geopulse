import { Badge, Input } from "@/components/ui";

export interface ResultFilterValues {
  mentioned: "all" | "yes" | "no";
  sentiment: "all" | "positive" | "neutral" | "negative";
  scoreMin: string;
  scoreMax: string;
}

interface ResultFiltersProps {
  filters: ResultFilterValues;
  onChange: (filters: ResultFilterValues) => void;
}

const mentionOptions = [
  { value: "all", label: "All" },
  { value: "yes", label: "Mentioned" },
  { value: "no", label: "Not mentioned" },
] as const;

const sentimentOptions = [
  { value: "all", label: "All" },
  { value: "positive", label: "Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negative" },
] as const;

export function ResultFilters({ filters, onChange }: ResultFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Mentioned toggle */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Mentioned:</span>
        {mentionOptions.map((opt) => (
          <Badge
            key={opt.value}
            variant={filters.mentioned === opt.value ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => onChange({ ...filters, mentioned: opt.value })}
          >
            {opt.label}
          </Badge>
        ))}
      </div>

      {/* Sentiment toggle */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Sentiment:</span>
        {sentimentOptions.map((opt) => (
          <Badge
            key={opt.value}
            variant={filters.sentiment === opt.value ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => onChange({ ...filters, sentiment: opt.value })}
          >
            {opt.label}
          </Badge>
        ))}
      </div>

      {/* Score range */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Score:</span>
        <Input
          type="number"
          min={0}
          max={5}
          step={0.1}
          placeholder="Min"
          value={filters.scoreMin}
          onChange={(e) => onChange({ ...filters, scoreMin: e.target.value })}
          className="h-7 w-16 text-xs"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="number"
          min={0}
          max={5}
          step={0.1}
          placeholder="Max"
          value={filters.scoreMax}
          onChange={(e) => onChange({ ...filters, scoreMax: e.target.value })}
          className="h-7 w-16 text-xs"
        />
      </div>
    </div>
  );
}
