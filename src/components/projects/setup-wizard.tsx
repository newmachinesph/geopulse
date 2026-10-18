"use client";

import * as React from "react";
import { IconCheck, IconRadar, IconArrowRight } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MARKETS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "it", label: "Italian" },
  { value: "nl", label: "Dutch" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
];

const WIZARD_STEPS: { label: string; description: string }[] = [
  { label: "Configure", description: "Set up your project details" },
  { label: "Validation", description: "Validate brand presence" },
  { label: "Prompts", description: "Generate & review prompts" },
];

// ---------------------------------------------------------------------------
// SetupStepper
// ---------------------------------------------------------------------------

interface SetupStepperProps {
  currentStep: number; // 1, 2, or 3
  steps: { label: string; description: string }[];
}

function SetupStepper({ currentStep, steps }: SetupStepperProps) {
  return (
    <div className="flex items-start justify-center w-full">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isUpcoming = stepNumber > currentStep;

        return (
          <React.Fragment key={step.label}>
            {/* Step circle + label group */}
            <div className="flex flex-col items-center gap-2 min-w-[120px]">
              {/* Circle */}
              <div
                className={
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors " +
                  (isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isActive
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                      : "border-zinc-700 bg-zinc-800/50 text-zinc-500")
                }
              >
                {isCompleted ? (
                  <IconCheck className="h-5 w-5" />
                ) : (
                  stepNumber
                )}
              </div>

              {/* Label + description */}
              <div className="flex flex-col items-center text-center">
                <span
                  className={
                    "text-sm font-medium " +
                    (isCompleted
                      ? "text-emerald-400"
                      : isActive
                        ? "text-zinc-100"
                        : "text-zinc-500")
                  }
                >
                  {step.label}
                </span>
                <span
                  className={
                    "text-xs mt-0.5 " +
                    (isActive ? "text-zinc-400" : "text-zinc-600")
                  }
                >
                  {step.description}
                </span>
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex items-center h-10 flex-1 px-2">
                <div
                  className={
                    "h-0.5 w-full rounded-full transition-colors " +
                    (stepNumber < currentStep
                      ? "bg-emerald-500"
                      : "bg-zinc-700")
                  }
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Configure
// ---------------------------------------------------------------------------

interface ConfigureStepProps {
  siteUrl: string;
  brandName: string;
  market: string;
  language: string;
  onSiteUrlChange: (value: string) => void;
  onBrandNameChange: (value: string) => void;
  onMarketChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onNext: () => void;
}

function ConfigureStep({
  siteUrl,
  brandName,
  market,
  language,
  onSiteUrlChange,
  onBrandNameChange,
  onMarketChange,
  onLanguageChange,
  onNext,
}: ConfigureStepProps) {
  const isValid = siteUrl.trim().length > 0 && brandName.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Site URL */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Site URL</label>
        <Input
          placeholder="https://www.example.com"
          value={siteUrl}
          onChange={(e) => onSiteUrlChange(e.target.value)}
        />
      </div>

      {/* Brand name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Brand Name</label>
        <Input
          placeholder="My Brand"
          value={brandName}
          onChange={(e) => onBrandNameChange(e.target.value)}
        />
      </div>

      {/* Market + Language row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Market */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Market</label>
          <Select value={market} onValueChange={onMarketChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select market" />
            </SelectTrigger>
            <SelectContent>
              {MARKETS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Language</label>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end pt-2">
        <Button
          disabled={!isValid}
          onClick={onNext}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <IconRadar className="h-4 w-4 mr-2" />
          Start Analysis
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Validation
// ---------------------------------------------------------------------------

interface ValidationStepProps {
  onNext: () => void;
}

function ValidationStep({ onNext }: ValidationStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 p-12">
        <p className="text-sm text-zinc-400">
          Brand validation results will appear here
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={onNext}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Continue
          <IconArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Prompts
// ---------------------------------------------------------------------------

interface PromptsStepProps {
  onComplete: () => void;
}

function PromptsStep({ onComplete }: PromptsStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 p-12">
        <p className="text-sm text-zinc-400">
          Generated prompts will appear here
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={onComplete}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <IconRadar className="h-4 w-4 mr-2" />
          Launch GEO
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SetupWizard
// ---------------------------------------------------------------------------

interface SetupWizardProps {
  onComplete?: (data: {
    projectName: string;
    siteUrl: string;
    brandName: string;
    market: string;
    language: string;
  }) => void;
}

function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(1);

  // Form state
  const [siteUrl, setSiteUrl] = React.useState("");
  const [brandName, setBrandName] = React.useState("");
  const [market, setMarket] = React.useState("us");
  const [language, setLanguage] = React.useState("en");

  // When market changes, derive default language
  const handleMarketChange = React.useCallback((value: string) => {
    setMarket(value);
    const matched = MARKETS.find((m) => m.value === value);
    if (matched) {
      setLanguage(matched.language);
    }
  }, []);

  const handleStep1Next = React.useCallback(() => {
    setCurrentStep(2);
  }, []);

  const handleStep2Next = React.useCallback(() => {
    setCurrentStep(3);
  }, []);

  const handleComplete = React.useCallback(() => {
    onComplete?.({
      projectName: brandName,
      siteUrl,
      brandName,
      market,
      language,
    });
  }, [onComplete, brandName, siteUrl, market, language]);

  // Step title for the card header area
  const stepTitle =
    "Step " +
    currentStep +
    " of 3: " +
    WIZARD_STEPS[currentStep - 1].label;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      {/* Stepper */}
      <SetupStepper currentStep={currentStep} steps={WIZARD_STEPS} />

      {/* Step content card */}
      <Card className="border-zinc-800 bg-zinc-950">
        <CardContent className="p-6">
          {/* Step header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-100">
              {stepTitle}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {WIZARD_STEPS[currentStep - 1].description}
            </p>
          </div>

          {/* Step body */}
          {currentStep === 1 && (
            <ConfigureStep
              siteUrl={siteUrl}
              brandName={brandName}
              market={market}
              language={language}
              onSiteUrlChange={setSiteUrl}
              onBrandNameChange={setBrandName}
              onMarketChange={handleMarketChange}
              onLanguageChange={setLanguage}
              onNext={handleStep1Next}
            />
          )}

          {currentStep === 2 && (
            <ValidationStep onNext={handleStep2Next} />
          )}

          {currentStep === 3 && (
            <PromptsStep onComplete={handleComplete} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { SetupWizard, SetupStepper, LANGUAGES };
export type { SetupWizardProps, SetupStepperProps };
