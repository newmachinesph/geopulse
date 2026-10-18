import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@/components/ui";
import { INTENT_CATEGORIES } from "@/lib/constants";

interface PromptEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { text: string; intentCategory: string; tags: string }) => void;
  initial?: { text: string; intentCategory: string; tags: string };
}

export function PromptEditor({ open, onOpenChange, onSubmit, initial }: PromptEditorProps) {
  const [text, setText] = useState(initial?.text ?? "");
  const [intent, setIntent] = useState(initial?.intentCategory ?? "informational");
  const [tags, setTags] = useState(initial?.tags ?? "");

  const handleSubmit = () => {
    if (!text) return;
    onSubmit({ text, intentCategory: intent, tags });
    if (!initial) { setText(""); setIntent("informational"); setTags(""); }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Edit Prompt" : "Add Prompt"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Prompt Text</label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What is the best tool for..." rows={4} />
          </div>
          <div>
            <label className="text-sm font-medium">Intent Category</label>
            <Select value={intent} onValueChange={setIntent}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTENT_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Tags (comma-separated)</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="seo, brand, pricing" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!text}>{initial ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
