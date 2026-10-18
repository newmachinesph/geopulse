import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { MARKETS } from "@/lib/constants";
import { IconSparkles } from "@tabler/icons-react";
import { getInvoke } from "@/lib/store/tauri-helpers";
import type { CreateProjectInput } from "@/lib/types";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateProjectInput) => void;
}

export function CreateProjectDialog({ open, onOpenChange, onSubmit }: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [market, setMarket] = useState("us");
  const [language, setLanguage] = useState("en");
  const [description, setDescription] = useState("");
  const [isAutofilling, setIsAutofilling] = useState(false);

  const handleAutofill = async () => {
    if (!brandName.trim()) {
      toast.error("Enter a brand name first");
      return;
    }
    setIsAutofilling(true);
    try {
      const invoke = await getInvoke();
      const result = await invoke<{ siteUrl: string; industry: string; market: string; description: string }>("autofill_project", { brandName: brandName.trim() });
      setSiteUrl(result.siteUrl);
      setIndustry(result.industry);
      setDescription(result.description);
      if (!name) setName(`${brandName.trim()} GEO`);
      if (MARKETS.some((m) => m.value === result.market)) {
        setMarket(result.market);
        setLanguage(MARKETS.find((m) => m.value === result.market)?.language || "en");
      }
      toast.success("Fields auto-filled by AI");
    } catch (e) {
      toast.error(typeof e === "string" ? e : "AI autofill failed");
    } finally {
      setIsAutofilling(false);
    }
  };

  const handleSubmit = () => {
    if (!brandName) return;
    onSubmit({
      name: name || brandName,
      siteUrl: siteUrl || `https://www.${brandName.trim().toLowerCase().replace(/\s+/g, "")}.com`,
      brandName,
      industry: industry || "General",
      market,
      language,
      description: description || undefined,
    });
    setName(""); setSiteUrl(""); setBrandName(""); setIndustry(""); setMarket("us"); setLanguage("en"); setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Brand Name <span className="text-red-400">*</span></label>
            <div className="flex gap-2">
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Acme Corp" className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutofill}
                disabled={!brandName.trim() || isAutofilling}
                className="shrink-0 h-9"
              >
                <IconSparkles className={`h-4 w-4 mr-1 ${isAutofilling ? "animate-spin" : ""}`} />
                {isAutofilling ? "Filling..." : "AI Fill"}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Project Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Brand GEO" />
          </div>
          <div>
            <label className="text-sm font-medium">Site URL</label>
            <Input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://acme.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Industry</label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="SaaS, E-commerce, etc." />
          </div>
          <div>
            <label className="text-sm font-medium">Market</label>
            <Select value={market} onValueChange={(v) => { setMarket(v); setLanguage(MARKETS.find((m) => m.value === v)?.language || "en"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MARKETS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Project description..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!brandName}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
