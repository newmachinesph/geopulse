import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Badge } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { INTENT_CATEGORIES } from "@/lib/constants";
import { IconSparkles, IconLoader2 } from "@tabler/icons-react";

interface PromptGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (intentCategory: string) => Promise<string[]>;
  onAccept: (prompts: string[]) => void;
}

export function PromptGenerator({ open, onOpenChange, onGenerate, onAccept }: PromptGeneratorProps) {
  const [intent, setIntent] = useState("informational");
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const results = await onGenerate(intent);
      setSuggestions(results);
      setSelected(new Set(results.map((_, i) => i)));
    } finally {
      setGenerating(false);
    }
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleAccept = () => {
    const accepted = suggestions.filter((_, i) => selected.has(i));
    onAccept(accepted);
    onOpenChange(false);
    setSuggestions([]);
    setSelected(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Generate Prompts</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Intent Category</label>
            <Select value={intent} onValueChange={setIntent}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTENT_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconSparkles className="h-4 w-4" />}
            {generating ? "Generating..." : "Generate"}
          </Button>
          {suggestions.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-auto">
              {suggestions.map((s, i) => (
                <div key={i} onClick={() => toggleSelect(i)} className={"cursor-pointer rounded border p-2 text-sm " + (selected.has(i) ? "border-primary bg-primary/10" : "border-border")}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
        {suggestions.length > 0 && (
          <DialogFooter>
            <Badge variant="secondary">{selected.size} selected</Badge>
            <Button onClick={handleAccept} disabled={selected.size === 0}>Add Selected</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
