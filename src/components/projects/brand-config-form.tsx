import { useEffect, useState } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { IconCheck, IconSparkles } from "@tabler/icons-react";

/** Convert a JSON array string like '["a","b"]' to comma-separated "a, b". Passes through plain strings unchanged. */
function fromJsonArray(val: string): string {
  if (!val) return "";
  try {
    const arr = JSON.parse(val);
    if (Array.isArray(arr)) return arr.join(", ");
  } catch { /* not JSON, return as-is */ }
  return val;
}

interface BrandConfigFormProps {
  entityName: string;
  aliases: string;
  competitors: string;
  targetKeywords: string;
  onSave: (data: { entityName: string; aliases: string; competitors: string; targetKeywords: string }) => void;
  onAutofill?: () => Promise<{ entityName: string; aliases: string[]; competitors: string[]; targetKeywords: string[] }>;
  isAutofilling?: boolean;
}

export function BrandConfigForm({ entityName: initial, aliases: initAliases, competitors: initComps, targetKeywords: initKw, onSave, onAutofill, isAutofilling }: BrandConfigFormProps) {
  const [entityName, setEntityName] = useState(initial);
  const [aliases, setAliases] = useState(fromJsonArray(initAliases));
  const [competitors, setCompetitors] = useState(fromJsonArray(initComps));
  const [keywords, setKeywords] = useState(fromJsonArray(initKw));

  // Sync from props when parent refreshes data
  useEffect(() => { setEntityName(initial); }, [initial]);
  useEffect(() => { setAliases(fromJsonArray(initAliases)); }, [initAliases]);
  useEffect(() => { setCompetitors(fromJsonArray(initComps)); }, [initComps]);
  useEffect(() => { setKeywords(fromJsonArray(initKw)); }, [initKw]);

  const handleAutofill = async () => {
    if (!onAutofill) return;
    try {
      const result = await onAutofill();
      setEntityName(result.entityName);
      setAliases(result.aliases.join(", "));
      setCompetitors(result.competitors.join(", "));
      setKeywords(result.targetKeywords.join(", "));
    } catch { /* error handled by parent */ }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Brand Configuration</CardTitle>
          {onAutofill && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutofill}
              disabled={isAutofilling}
            >
              <IconSparkles className="h-4 w-4" />
              {isAutofilling ? "Autofilling..." : "AI Autofill"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Entity Name</label>
          <Input value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="Exact brand entity name" />
        </div>
        <div>
          <label className="text-sm font-medium">Aliases (comma-separated)</label>
          <Input value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="Acme, ACME Corp, acme.com" />
        </div>
        <div>
          <label className="text-sm font-medium">Competitors (comma-separated)</label>
          <Input value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="CompetitorA, CompetitorB" />
        </div>
        <div>
          <label className="text-sm font-medium">Target Keywords (comma-separated)</label>
          <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="keyword1, keyword2" />
        </div>
        <Button onClick={() => onSave({ entityName, aliases, competitors, targetKeywords: keywords })}>
          <IconCheck className="h-4 w-4" /> Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
}
