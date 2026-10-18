"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Progress,
} from "@/components/ui";
import {
  IconCircleCheck,
  IconAlertCircle,
  IconAlertTriangle,
  IconShieldCheck,
  IconBuildingStore,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react";
import type { BrandValidationResult, ProductService } from "@/lib/types";

interface BrandValidationCardProps {
  entityName: string;
  validation: BrandValidationResult | null;
  isValidating?: boolean;
  onValidate?: () => void;
  onRefresh?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusConfig(status: BrandValidationResult["status"]) {
  switch (status) {
    case "validated":
      return {
        label: "Validated",
        variant: "positive" as const,
        Icon: IconCircleCheck,
        color: "text-positive",
      };
    case "partial":
      return {
        label: "Partial Match",
        variant: "mixed" as const,
        Icon: IconAlertTriangle,
        color: "text-mixed",
      };
    case "unrecognized":
      return {
        label: "Unrecognized",
        variant: "negative" as const,
        Icon: IconAlertCircle,
        color: "text-negative",
      };
  }
}

function getConfidenceVariant(confidence: number) {
  if (confidence >= 75) return "score-high" as const;
  if (confidence >= 40) return "score-medium" as const;
  return "score-low" as const;
}

function getScoreColor(score: number, maxScore: number) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-red-500";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoreBar({ product }: { product: ProductService }) {
  const pct = product.maxScore > 0
    ? Math.round((product.score / product.maxScore) * 100)
    : 0;

  return (
    <div className="rounded-lg border border-border bg-card/60 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {product.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {product.score}/{product.maxScore}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={"h-full rounded-full transition-all " + getScoreColor(product.score, product.maxScore)}
          style={{ width: pct + "%" }}
        />
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
      {children}
    </h4>
  );
}

// ---------------------------------------------------------------------------
// Empty / Loading states
// ---------------------------------------------------------------------------

function EmptyState({ onValidate }: { onValidate?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
      <div className="rounded-full bg-muted/50 p-4">
        <IconShieldCheck className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          No validation data yet
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Run brand validation to confirm entity recognition, attribute
          extraction, and competitive positioning across AI engines.
        </p>
      </div>
      {onValidate && (
        <Button onClick={onValidate} className="mt-2">
          <IconShieldCheck className="mr-2 h-4 w-4" />
          Validate Brand
        </Button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
      <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          Validating brand entity...
        </p>
        <p className="text-sm text-muted-foreground">
          Querying AI engines and cross-referencing entity data. This may take a
          moment.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BrandValidationCard({
  entityName,
  validation,
  isValidating,
  onValidate,
  onRefresh,
}: BrandValidationCardProps) {
  // -- Loading state --
  if (isValidating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconShieldCheck className="h-5 w-5 text-primary" />
            Brand Validation
          </CardTitle>
          <CardDescription>Analyzing {entityName}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  // -- Empty state --
  if (!validation) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconShieldCheck className="h-5 w-5 text-muted-foreground" />
                Brand Validation
              </CardTitle>
              <CardDescription>
                Validate entity recognition for {entityName}
              </CardDescription>
            </div>
            {onRefresh && (
              <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh brand data">
                <IconRefresh className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState onValidate={onValidate} />
        </CardContent>
      </Card>
    );
  }

  // -- Rich validation state --
  const statusCfg = getStatusConfig(validation.status);
  const StatusIcon = statusCfg.Icon;
  const confidenceVariant = getConfidenceVariant(validation.confidence);

  return (
    <Card>
      {/* ---- Header ---- */}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60 " +
                statusCfg.color
              }
            >
              <IconBuildingStore className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg truncate">{entityName}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {validation.category}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onRefresh && (
              <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh brand data" className="h-8 w-8">
                <IconRefresh className="h-4 w-4" />
              </Button>
            )}
            <Badge variant={confidenceVariant}>
              {validation.confidence}% confidence
            </Badge>
            <Badge variant={statusCfg.variant} className="gap-1">
              <StatusIcon className="h-3.5 w-3.5" />
              {statusCfg.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ---- Description ---- */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {validation.description}
        </p>

        {/* ---- Key Attributes ---- */}
        {validation.knownAttributes.length > 0 && (
          <div>
            <SectionHeading>Key Attributes</SectionHeading>
            <div className="flex flex-wrap gap-1.5">
              {validation.knownAttributes.map(function (attr) {
                return (
                  <Badge key={attr} variant="secondary" className="text-xs">
                    {attr}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Related Businesses ---- */}
        {validation.relatedBusinesses.length > 0 && (
          <div>
            <SectionHeading>Related Businesses</SectionHeading>
            <div className="flex flex-wrap gap-1.5">
              {validation.relatedBusinesses.map(function (biz) {
                return (
                  <Badge key={biz} variant="outline" className="text-xs">
                    <IconBuildingStore className="mr-1 h-3 w-3" />
                    {biz}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Products / Services ---- */}
        {validation.productsServices.length > 0 && (
          <div>
            <SectionHeading>Products &amp; Services</SectionHeading>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {validation.productsServices.map(function (ps) {
                return <ScoreBar key={ps.name} product={ps} />;
              })}
            </div>
          </div>
        )}

        {/* ---- Competitors ---- */}
        {(validation.competitorsConfirmed.length > 0 ||
          validation.competitorsDiscovered.length > 0) && (
          <div>
            <SectionHeading>Competitors</SectionHeading>
            <div className="flex flex-wrap gap-1.5">
              {validation.competitorsConfirmed.map(function (c) {
                return (
                  <Badge key={"c-" + c} variant="positive" className="text-xs gap-1">
                    <IconCircleCheck className="h-3 w-3" />
                    {c}
                  </Badge>
                );
              })}
              {validation.competitorsDiscovered.map(function (d) {
                return (
                  <Badge key={"d-" + d} variant="mixed" className="text-xs gap-1">
                    <IconAlertTriangle className="h-3 w-3" />
                    {d}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Warnings ---- */}
        {validation.warnings.length > 0 && (
          <div className="rounded-lg border border-mixed/30 bg-mixed/5 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-mixed">
              <IconAlertTriangle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Warnings
              </span>
            </div>
            <ul className="space-y-1">
              {validation.warnings.map(function (w, i) {
                return (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2"
                  >
                    <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-mixed" />
                    {w}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ---- Confidence progress bar ---- */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Overall Confidence</span>
            <span className="font-medium text-foreground">
              {validation.confidence}%
            </span>
          </div>
          <Progress value={validation.confidence} />
        </div>
      </CardContent>
    </Card>
  );
}
