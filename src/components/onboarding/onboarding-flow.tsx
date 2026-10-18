import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { useProjectsStore, useSettingsStore } from "@/lib/store";
import { MARKETS } from "@/lib/constants";
import { IconRadar, IconArrowRight, IconKey, IconRocket, IconBrandOpenai, IconSparkles } from "@tabler/icons-react";
import { getInvoke } from "@/lib/store/tauri-helpers";

const STEPS = [
  { label: "Welcome", description: "Get started with GEOPulse" },
  { label: "API Keys", description: "Connect your AI engines" },
  { label: "First Project", description: "Set up your brand" },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i < current ? "w-8 bg-emerald-500" : i === current ? "w-8 bg-emerald-500/60" : "w-2 bg-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}

export function OnboardingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const { createProject } = useProjectsStore();
  const { settings, updateOpenaiApiKey, updatePerplexityApiKey, updateGoogleApiKey, saveSettings } = useSettingsStore();

  // Project form state
  const [brandName, setBrandName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [market, setMarket] = useState("us");
  const [description, setDescription] = useState("");
  const [isAutofilling, setIsAutofilling] = useState(false);

  const hasAnyKey = settings.openaiApiKey.length > 0 || settings.perplexityApiKey.length > 0 || settings.googleApiKey.length > 0;

  const handleSaveKeys = async () => {
    if (!hasAnyKey) {
      toast.error("Enter at least one API key");
      return;
    }
    await saveSettings();
    toast.success("API keys saved");
    setStep(2);
  };

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
      if (MARKETS.some((m) => m.value === result.market)) {
        setMarket(result.market);
      }
      toast.success("Fields auto-filled by AI");
    } catch (e) {
      toast.error(typeof e === "string" ? e : "AI autofill failed");
    } finally {
      setIsAutofilling(false);
    }
  };

  const handleCreateProject = async () => {
    if (!brandName.trim()) {
      toast.error("Brand name is required");
      return;
    }
    try {
      await createProject({
        name: brandName,
        siteUrl: siteUrl || `https://www.${brandName.trim().toLowerCase().replace(/\s+/g, "")}.com`,
        brandName,
        industry: industry || "General",
        market,
        language: MARKETS.find((m) => m.value === market)?.language || "en",
        description: description || undefined,
      });
      toast.success("Project created! Welcome to GEOPulse.");
      navigate("/projects");
    } catch {
      toast.error("Failed to create project");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <StepIndicator current={step} total={STEPS.length} />

        {step === 0 && (
          <Card className="border-zinc-800">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                  <IconRadar className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome to GEOPulse</h1>
                <p className="text-muted-foreground mt-2">
                  Monitor your brand's visibility across AI engines like ChatGPT, Perplexity, and Google Gemini.
                </p>
              </div>
              <div className="text-left space-y-3 text-sm">
                <div className="flex gap-3 items-start">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">1</span>
                  <span className="text-muted-foreground">Configure API keys for the AI engines you want to monitor</span>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">2</span>
                  <span className="text-muted-foreground">Create a project with your brand details</span>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">3</span>
                  <span className="text-muted-foreground">Generate prompts, run scans, and track your GEO visibility</span>
                </div>
              </div>
              <Button onClick={() => setStep(1)} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Get Started
                <IconArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card className="border-zinc-800">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <IconKey className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Connect AI Engines</h2>
                  <p className="text-sm text-muted-foreground">Enter at least one API key to get started</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <IconBrandOpenai className="h-4 w-4" /> OpenAI (ChatGPT)
                  </label>
                  <Input
                    type="password"
                    value={settings.openaiApiKey}
                    onChange={(e) => updateOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Perplexity</label>
                  <Input
                    type="password"
                    value={settings.perplexityApiKey}
                    onChange={(e) => updatePerplexityApiKey(e.target.value)}
                    placeholder="pplx-..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Google (Gemini)</label>
                  <Input
                    type="password"
                    value={settings.googleApiKey}
                    onChange={(e) => updateGoogleApiKey(e.target.value)}
                    placeholder="AI..."
                    className="mt-1"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Keys are stored locally on your device. You can update them anytime in Settings.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
                <Button onClick={handleSaveKeys} disabled={!hasAnyKey} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  Save & Continue
                  <IconArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-zinc-800">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <IconRocket className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Create Your First Project</h2>
                  <p className="text-sm text-muted-foreground">Enter your brand name, then let AI fill the rest</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Brand Name <span className="text-red-400">*</span></label>
                  <div className="flex gap-2 mt-1">
                    <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="My Company" className="flex-1" />
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
                  <label className="text-sm font-medium">Website URL</label>
                  <Input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://www.example.com" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Industry</label>
                  <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. SaaS, E-commerce, Healthcare" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Primary Market</label>
                  <Select value={market} onValueChange={setMarket}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKETS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={!brandName.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <IconRocket className="h-4 w-4 mr-2" />
                  Create Project & Start
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
