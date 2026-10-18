import { Badge } from "@/components/ui";
import { INTENT_CATEGORIES } from "@/lib/constants";
import type { IntentCategory } from "@/lib/types";

interface IntentCategoryFilterProps {
  selected: IntentCategory | null;
  onSelect: (category: IntentCategory | null) => void;
}

export function IntentCategoryFilter({ selected, onSelect }: IntentCategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={selected === null ? "default" : "outline"} className="cursor-pointer" onClick={() => onSelect(null)}>All</Badge>
      {INTENT_CATEGORIES.map((c) => (
        <Badge key={c.value} variant={selected === c.value ? "default" : "outline"} className="cursor-pointer" onClick={() => onSelect(c.value)}>
          {c.label}
        </Badge>
      ))}
    </div>
  );
}
