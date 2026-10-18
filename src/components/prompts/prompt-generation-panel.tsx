"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IconSparkles,
  IconRocket,
  IconCheck,
  IconFilter,
} from "@tabler/icons-react";
import { INTENT_CATEGORIES } from "@/lib/constants";
import type {
  GeneratedPromptItem,
  PromptDistribution,
  IntentCategory,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PromptGenerationPanelProps {
  prompts: GeneratedPromptItem[];
  distributions: PromptDistribution[];
  projectUrl?: string;
  isGenerating?: boolean;
  onGenerate?: () => void;
  onAccept?: (selected: GeneratedPromptItem[]) => void;
  onLaunchScan?: (selected: GeneratedPromptItem[]) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INTENT_COLOR_MAP: Record<IntentCategory, string> = {
  informational: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  navigational: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  commercial: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  transactional: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  comparison: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  recommendation: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const INTENT_ACCENT_MAP: Record<IntentCategory, string> = {
  informational: "border-blue-500/40",
  navigational: "border-purple-500/40",
  commercial: "border-amber-500/40",
  transactional: "border-emerald-500/40",
  comparison: "border-cyan-500/40",
  recommendation: "border-rose-500/40",
};

const INTENT_NUMBER_MAP: Record<IntentCategory, string> = {
  informational: "text-blue-400",
  navigational: "text-purple-400",
  commercial: "text-amber-400",
  transactional: "text-emerald-400",
  comparison: "text-cyan-400",
  recommendation: "text-rose-400",
};

function getLabelForCategory(category: IntentCategory): string {
  const found = INTENT_CATEGORIES.find((c) => c.value === category);
  return found ? found.label : category;
}

function groupByCategory(
  prompts: GeneratedPromptItem[]
): Record<string, GeneratedPromptItem[]> {
  const groups: Record<string, GeneratedPromptItem[]> = {};
  for (const p of prompts) {
    const key = p.intentCategory;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return groups;
}

function groupByPersona(
  prompts: GeneratedPromptItem[]
): Record<string, GeneratedPromptItem[]> {
  const groups: Record<string, GeneratedPromptItem[]> = {};
  for (const p of prompts) {
    const key = p.personaName || "Unassigned";
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatsHeader({ total, distributions }: { total: number; distributions: PromptDistribution[] }) {
  const subtitle = distributions
    .filter((d) => d.count > 0)
    .map((d) => d.count + " " + d.label)
    .join(" \u00B7 ");

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <IconSparkles className="h-6 w-6 text-emerald-400" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {total + " prompts generated"}
        </h1>
      </div>
      {subtitle && (
        <p className="text-sm text-muted-foreground pl-9">{subtitle}</p>
      )}
    </div>
  );
}

function DistributionCards({
  distributions,
}: {
  distributions: PromptDistribution[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {distributions.map((d) => {
        const accent =
          INTENT_ACCENT_MAP[d.category] || "border-border";
        const numberColor =
          INTENT_NUMBER_MAP[d.category] || "text-foreground";

        return (
          <Card
            key={d.category}
            className={
              "relative overflow-hidden border " +
              accent +
              " bg-card/60 backdrop-blur"
            }
          >
            <CardContent className="p-4 text-center">
              <p
                className={
                  "text-3xl font-extrabold tabular-nums " + numberColor
                }
              >
                {d.count}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground truncate">
                {d.label}
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                {"target " + d.targetPercent + "%"}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function PromptRow({
  prompt,
  isSelected,
  onToggle,
}: {
  prompt: GeneratedPromptItem;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const colorClasses =
    INTENT_COLOR_MAP[prompt.intentCategory] || "bg-muted text-muted-foreground";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        "group flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all " +
        (isSelected
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border bg-card/40 hover:border-border/80 hover:bg-card/60")
      }
    >
      {/* Checkbox indicator */}
      <div
        className={
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors " +
          (isSelected
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-muted-foreground/30 bg-transparent")
        }
      >
        {isSelected && <IconCheck className="h-3 w-3" />}
      </div>

      {/* Prompt text */}
      <span className="flex-1 text-sm text-foreground leading-relaxed">
        {prompt.text}
      </span>

      {/* Right side: score + intent badge */}
      <div className="flex shrink-0 items-center gap-2">
        {prompt.score && (
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {prompt.score}
          </span>
        )}
        <Badge
          className={
            "pointer-events-none border text-[10px] font-semibold uppercase tracking-wider " +
            colorClasses
          }
        >
          {getLabelForCategory(prompt.intentCategory)}
        </Badge>
      </div>
    </button>
  );
}

function PromptGroup({
  groupLabel,
  groupCount,
  prompts,
  selectedSet,
  onToggle,
}: {
  groupLabel: string;
  groupCount: number;
  prompts: GeneratedPromptItem[];
  selectedSet: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="space-y-2">
      {/* Group header */}
      <div className="flex items-center gap-2 px-1">
        <h3 className="text-sm font-semibold text-foreground">
          {groupLabel}
        </h3>
        <Badge variant="secondary" className="text-[10px]">
          {groupCount}
        </Badge>
      </div>

      {/* Prompt rows */}
      <div className="space-y-1.5">
        {prompts.map((p, idx) => {
          const key = p.intentCategory + "::" + idx + "::" + p.text;
          return (
            <PromptRow
              key={key}
              prompt={p}
              isSelected={selectedSet.has(key)}
              onToggle={() => onToggle(key)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PromptGenerationPanel({
  prompts,
  distributions,
  projectUrl,
  isGenerating = false,
  onGenerate,
  onAccept,
  onLaunchScan,
}: PromptGenerationPanelProps) {
  // -- State ---------------------------------------------------------------
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => {
    // Select all by default
    const keys = new Set<string>();
    prompts.forEach((p, idx) => {
      keys.add(p.intentCategory + "::" + idx + "::" + p.text);
    });
    return keys;
  });

  const [viewMode, setViewMode] = useState<"type" | "persona">("type");
  const [aiAssisted, setAiAssisted] = useState(true);
  const [filterText, setFilterText] = useState("");

  // -- Derived data --------------------------------------------------------
  const filteredPrompts = useMemo(() => {
    if (!filterText.trim()) return prompts;
    const lower = filterText.toLowerCase();
    return prompts.filter(
      (p) =>
        p.text.toLowerCase().includes(lower) ||
        p.intentCategory.toLowerCase().includes(lower) ||
        (p.personaName && p.personaName.toLowerCase().includes(lower))
    );
  }, [prompts, filterText]);

  const grouped = useMemo(() => {
    if (viewMode === "persona") return groupByPersona(filteredPrompts);
    return groupByCategory(filteredPrompts);
  }, [filteredPrompts, viewMode]);

  const selectedCount = selectedKeys.size;

  const selectedPrompts = useMemo(() => {
    return prompts.filter((p, idx) => {
      const key = p.intentCategory + "::" + idx + "::" + p.text;
      return selectedKeys.has(key);
    });
  }, [prompts, selectedKeys]);

  // -- Handlers ------------------------------------------------------------
  const toggleKey = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const keys = new Set<string>();
    prompts.forEach((p, idx) => {
      keys.add(p.intentCategory + "::" + idx + "::" + p.text);
    });
    setSelectedKeys(keys);
  }, [prompts]);

  const deselectAll = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  // -- Render --------------------------------------------------------------
  return (
    <div className="flex h-full flex-col bg-background">
      {/* ================================================================
          TOP SECTION: Stats + Distribution
          ================================================================ */}
      <div className="border-b border-border bg-card/30 px-6 py-5 space-y-5">
        {/* Stats header row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <StatsHeader total={prompts.length} distributions={distributions} />

          {/* Generate / Regenerate button */}
          {onGenerate && (
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <IconSparkles className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Regenerate"}
            </Button>
          )}
        </div>

        {/* Distribution counter cards */}
        {distributions.length > 0 && (
          <DistributionCards distributions={distributions} />
        )}
      </div>

      {/* ================================================================
          TOOLBAR: View toggle, Mode switch, Filter, Select controls
          ================================================================ */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-3">
        {/* View toggle tabs */}
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "type" | "persona")}
        >
          <TabsList>
            <TabsTrigger value="type">By type</TabsTrigger>
            <TabsTrigger value="persona">By persona</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Separator */}
        <div className="h-5 w-px bg-border" />

        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <span
            className={
              "text-xs font-medium " +
              (!aiAssisted ? "text-foreground" : "text-muted-foreground")
            }
          >
            Manual
          </span>
          <Switch
            checked={aiAssisted}
            onCheckedChange={setAiAssisted}
            className="data-[state=checked]:bg-emerald-600"
          />
          <span
            className={
              "text-xs font-medium " +
              (aiAssisted ? "text-foreground" : "text-muted-foreground")
            }
          >
            AI-assisted
          </span>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-border" />

        {/* Filter input */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <IconFilter className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter prompts..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>

        {/* Select / Deselect all */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAll}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Select all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={deselectAll}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Deselect all
          </Button>
        </div>
      </div>

      {/* ================================================================
          MAIN CONTENT: Scrollable grouped prompt list
          ================================================================ */}
      <ScrollArea className="flex-1">
        <div className="space-y-6 px-6 py-5">
          {Object.keys(grouped).length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconSparkles className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {prompts.length === 0
                  ? "No prompts generated yet. Click Generate to create prompts."
                  : "No prompts match your filter."}
              </p>
            </div>
          )}

          {Object.entries(grouped).map(([groupKey, groupPrompts]) => {
            const label =
              viewMode === "type"
                ? getLabelForCategory(groupKey as IntentCategory)
                : groupKey;

            // Build keys for this group to check selection
            const groupSelectedSet = new Set<string>();
            groupPrompts.forEach((p, idx) => {
              // We need the global index for key consistency
              const globalIdx = prompts.findIndex(
                (gp) =>
                  gp.text === p.text &&
                  gp.intentCategory === p.intentCategory &&
                  gp.personaName === p.personaName
              );
              const key =
                p.intentCategory +
                "::" +
                (globalIdx !== -1 ? globalIdx : idx) +
                "::" +
                p.text;
              if (selectedKeys.has(key)) {
                groupSelectedSet.add(key);
              }
            });

            return (
              <PromptGroup
                key={groupKey}
                groupLabel={label}
                groupCount={groupPrompts.length}
                prompts={groupPrompts.map((p) => {
                  // Attach globalIdx-based key generation in PromptGroup
                  return p;
                })}
                selectedSet={selectedKeys}
                onToggle={(key) => toggleKey(key)}
              />
            );
          })}
        </div>
      </ScrollArea>

      {/* ================================================================
          BOTTOM ACTION BAR
          ================================================================ */}
      <div className="border-t border-border bg-card/50 backdrop-blur px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: URL display + selected count */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
            <Badge
              variant="outline"
              className={
                "gap-1.5 px-3 py-1 " +
                (selectedCount > 0
                  ? "border-emerald-500/40 text-emerald-400"
                  : "text-muted-foreground")
              }
            >
              <IconCheck className="h-3.5 w-3.5" />
              {selectedCount + " selected"}
            </Badge>

            {projectUrl && (
              <span className="truncate text-xs text-muted-foreground max-w-sm">
                {projectUrl}
              </span>
            )}
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-2">
            {onAccept && (
              <Button
                variant="outline"
                onClick={() => onAccept(selectedPrompts)}
                disabled={selectedCount === 0}
                className="gap-2"
              >
                <IconCheck className="h-4 w-4" />
                Add to Project
              </Button>
            )}
            {onLaunchScan && (
              <Button
                onClick={() => onLaunchScan(selectedPrompts)}
                disabled={selectedCount === 0}
                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <IconRocket className="h-4 w-4" />
                Launch GEO
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
