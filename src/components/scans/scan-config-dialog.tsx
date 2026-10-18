import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Switch, Badge } from "@/components/ui";
import { AI_ENGINES, MARKETS } from "@/lib/constants";
import { IconRocket } from "@tabler/icons-react";

interface ScanConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLaunch: (config: { engines: string[]; markets: string[]; geoSimulation: boolean }) => void;
}

export function ScanConfigDialog({ open, onOpenChange, onLaunch }: ScanConfigDialogProps) {
  const [engines, setEngines] = useState<string[]>(["chatgpt", "perplexity", "google_aio"]);
  const [markets, setMarkets] = useState<string[]>(["us"]);
  const [geoSim, setGeoSim] = useState(false);

  const toggleEngine = (val: string) => setEngines((prev) => prev.includes(val) ? prev.filter((e) => e !== val) : [...prev, val]);
  const toggleMarket = (val: string) => setMarkets((prev) => prev.includes(val) ? prev.filter((m) => m !== val) : [...prev, val]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Scan Configuration</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">AI Engines</label>
            <div className="flex flex-wrap gap-2">
              {AI_ENGINES.map((e) => (
                <Badge key={e.value} variant={engines.includes(e.value) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleEngine(e.value)}>
                  {e.label}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Markets</label>
            <div className="flex flex-wrap gap-2">
              {MARKETS.map((m) => (
                <Badge key={m.value} variant={markets.includes(m.value) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleMarket(m.value)}>
                  {m.label}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Geo Simulation</label>
            <Switch checked={geoSim} onCheckedChange={setGeoSim} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onLaunch({ engines, markets, geoSimulation: geoSim }); onOpenChange(false); }} disabled={engines.length === 0 || markets.length === 0}>
            <IconRocket className="h-4 w-4" /> Launch Scan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
