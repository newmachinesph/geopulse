import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

export function getScoreColor(score: number): string {
  if (score >= 4) return "text-score-high";
  if (score >= 2) return "text-score-medium";
  return "text-score-low";
}

export function getScoreBgColor(score: number): string {
  if (score >= 4) return "bg-score-high/20";
  if (score >= 2) return "bg-score-medium/20";
  return "bg-score-low/20";
}

export function getScoreLabel(score: number): string {
  if (score >= 4) return "Strong";
  if (score >= 2) return "Moderate";
  return "Low";
}

export function getScoreVariant(score: number): "score-high" | "score-medium" | "score-low" {
  if (score >= 4) return "score-high";
  if (score >= 2) return "score-medium";
  return "score-low";
}

export function getSentimentColor(score: number): string {
  if (score >= 0.5) return "text-positive";
  if (score >= -0.5) return "text-neutral";
  return "text-negative";
}

export function getSentimentLabel(level: string): string {
  switch (level) {
    case "positive": return "Positive";
    case "neutral": return "Neutral";
    case "negative": return "Negative";
    default: return level;
  }
}

export function getEngineLabel(engine: string): string {
  switch (engine) {
    case "chatgpt": return "ChatGPT";
    case "perplexity": return "Perplexity";
    case "google_aio": return "Google AIO";
    default: return engine;
  }
}

export function getEngineColor(engine: string): string {
  switch (engine) {
    case "chatgpt": return "text-engine-chatgpt";
    case "perplexity": return "text-engine-perplexity";
    case "google_aio": return "text-engine-google";
    default: return "text-muted-foreground";
  }
}
