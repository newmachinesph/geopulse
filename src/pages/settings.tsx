import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Switch } from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { useSettingsStore } from "@/lib/store";
import { MARKETS } from "@/lib/constants";
import { toast } from "sonner";
import { IconDeviceFloppy, IconEye, IconEyeOff, IconRefresh, IconTrash, IconAlertTriangle } from "@tabler/icons-react";
import { resetWalkthrough, startWalkthrough } from "@/lib/walkthrough";
import { getInvoke } from "@/lib/store/tauri-helpers";

function maskKey(key: string): string {
  if (key.length <= 8) return key ? "\u2022".repeat(key.length) : "";
  return key.slice(0, 4) + "\u2022".repeat(key.length - 8) + key.slice(-4);
}

function ApiKeyInput({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        {editing || !value ? (
          <Input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            placeholder={placeholder}
            autoFocus={editing}
          />
        ) : (
          <Input
            type="text"
            value={visible ? value : maskKey(value)}
            readOnly
            onClick={() => setEditing(true)}
            className="cursor-pointer"
          />
        )}
        {value && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {visible ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const {
    settings, isInitialized, isSaving,
    loadSettings, saveSettings,
    updateOpenaiApiKey, updatePerplexityApiKey, updateGoogleApiKey,
    updateProxy, updateScanDefaults,
  } = useSettingsStore();

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!isInitialized) loadSettings();
  }, [isInitialized, loadSettings]);

  const handleSave = async () => {
    await saveSettings();
    toast.success("Settings saved");
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const invoke = await getInvoke();
      await invoke("reset_application");
      resetWalkthrough();
      localStorage.clear();
      toast.success("Application reset complete");
      setShowResetDialog(false);
      setResetConfirm("");
      navigate("/");
      window.location.reload();
    } catch (e) {
      toast.error(`Reset failed: ${e}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <PageLayout title="Settings" subtitle="Configure API keys, proxy, and scan defaults">
      <div className="max-w-2xl space-y-6">
        {/* API Keys */}
        <Card>
          <CardHeader><CardTitle className="text-base">API Keys</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ApiKeyInput label="OpenAI API Key" value={settings.openaiApiKey} onChange={updateOpenaiApiKey} placeholder="sk-..." />
            <ApiKeyInput label="Perplexity API Key" value={settings.perplexityApiKey} onChange={updatePerplexityApiKey} placeholder="pplx-..." />
            <ApiKeyInput label="Google API Key" value={settings.googleApiKey} onChange={updateGoogleApiKey} placeholder="AIza..." />
          </CardContent>
        </Card>

        {/* Proxy */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Proxy Configuration</CardTitle>
              <Switch checked={settings.proxy.enabled} onCheckedChange={(v) => updateProxy({ enabled: v })} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Server</label>
              <Input value={settings.proxy.server} onChange={(e) => updateProxy({ server: e.target.value })} placeholder="proxy.example.com:8080" disabled={!settings.proxy.enabled} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <Input value={settings.proxy.username} onChange={(e) => updateProxy({ username: e.target.value })} disabled={!settings.proxy.enabled} />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input type="password" value={settings.proxy.password} onChange={(e) => updateProxy({ password: e.target.value })} disabled={!settings.proxy.enabled} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Protocol</label>
              <Select value={settings.proxy.protocol} onValueChange={(v) => updateProxy({ protocol: v as "http" | "socks5" })} disabled={!settings.proxy.enabled}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="socks5">SOCKS5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {settings.proxy.enabled && (
              <div className="space-y-3 pt-2 border-t">
                <div>
                  <label className="text-sm font-medium">Per-Market Proxy Overrides</label>
                  <p className="text-xs text-muted-foreground">Assign different proxies to specific markets. Leave empty to use the default proxy above.</p>
                </div>
                <div className="grid gap-2">
                  {MARKETS.map((m) => (
                    <div key={m.value} className="flex items-center gap-3">
                      <span className="text-sm w-32 shrink-0">{m.label}</span>
                      <Input
                        value={settings.proxy.marketProxies[m.value] || ""}
                        onChange={(e) => {
                          const updated = { ...settings.proxy.marketProxies, [m.value]: e.target.value };
                          updateProxy({ marketProxies: updated });
                        }}
                        placeholder="socks5://proxy:1080 or http://proxy:8080"
                        className="text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scan Defaults */}
        <Card>
          <CardHeader><CardTitle className="text-base">Scan Defaults</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Max Concurrent Scans</label>
                <Input type="number" value={settings.scan.maxConcurrentScans} onChange={(e) => updateScanDefaults({ maxConcurrentScans: parseInt(e.target.value) || 3 })} />
              </div>
              <div>
                <label className="text-sm font-medium">Timeout (seconds)</label>
                <Input type="number" value={settings.scan.timeoutSeconds} onChange={(e) => updateScanDefaults({ timeoutSeconds: parseInt(e.target.value) || 120 })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Auto Schedule</label>
                <p className="text-xs text-muted-foreground">Automatically run scans on a schedule</p>
              </div>
              <Switch checked={settings.scan.autoSchedule} onCheckedChange={(v) => updateScanDefaults({ autoSchedule: v })} />
            </div>
            {settings.scan.autoSchedule && (
              <div>
                <label className="text-sm font-medium">Interval (hours)</label>
                <Input type="number" value={settings.scan.scheduleIntervalHours} onChange={(e) => updateScanDefaults({ scheduleIntervalHours: parseInt(e.target.value) || 24 })} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* App Walkthrough */}
        <Card>
          <CardHeader><CardTitle className="text-base">App Walkthrough</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Guided Tour</p>
                <p className="text-xs text-muted-foreground">Replay the app walkthrough to learn about all features</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetWalkthrough();
                  startWalkthrough();
                  toast.success("Walkthrough restarted");
                }}
              >
                <IconRefresh className="h-4 w-4" />
                Restart Tour
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={isSaving}>
          <IconDeviceFloppy className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader><CardTitle className="text-base text-destructive">Danger Zone</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Reset Application</p>
                <p className="text-xs text-muted-foreground">Delete all projects, scans, prompts, results, settings, and start fresh</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowResetDialog(true)}
              >
                <IconTrash className="h-4 w-4" />
                Reset All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IconAlertTriangle className="h-5 w-5 text-destructive" />
                Reset Application
              </DialogTitle>
              <DialogDescription>
                This will permanently delete all your data including projects, scans, prompts, results, API keys, and settings. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3">
              <label className="text-sm font-medium">Type <span className="font-mono text-destructive">RESET</span> to confirm</label>
              <Input
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                placeholder="Type RESET"
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowResetDialog(false); setResetConfirm(""); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={resetConfirm !== "RESET" || isResetting}
                onClick={handleReset}
              >
                {isResetting ? "Resetting..." : "Reset Everything"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
