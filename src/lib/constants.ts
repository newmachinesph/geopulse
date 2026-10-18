import type { AIEngine, IntentCategory } from "./types";

export const AI_ENGINES: { value: AIEngine; label: string }[] = [
  { value: "chatgpt", label: "ChatGPT" },
  { value: "perplexity", label: "Perplexity" },
  { value: "google_aio", label: "Google AIO" },
];

export const MARKETS = [
  { value: "us", label: "United States", language: "en" },
  { value: "uk", label: "United Kingdom", language: "en" },
  { value: "de", label: "Germany", language: "de" },
  { value: "fr", label: "France", language: "fr" },
  { value: "es", label: "Spain", language: "es" },
  { value: "it", label: "Italy", language: "it" },
  { value: "nl", label: "Netherlands", language: "nl" },
  { value: "br", label: "Brazil", language: "pt" },
  { value: "jp", label: "Japan", language: "ja" },
  { value: "au", label: "Australia", language: "en" },
  { value: "ca", label: "Canada", language: "en" },
  { value: "in", label: "India", language: "en" },
  { value: "ph", label: "Philippines", language: "en" },
];

export const INTENT_CATEGORIES: { value: IntentCategory; label: string; description: string }[] = [
  { value: "informational", label: "Informational", description: "User wants to learn or understand" },
  { value: "navigational", label: "Navigational", description: "User wants to find a specific brand/site" },
  { value: "commercial", label: "Commercial", description: "User is researching before purchase" },
  { value: "transactional", label: "Transactional", description: "User is ready to buy or act" },
  { value: "comparison", label: "Comparison", description: "User is comparing options" },
  { value: "recommendation", label: "Recommendation", description: "User wants suggestions" },
];

export const SCORE_THRESHOLDS = {
  high: 4,
  medium: 2,
  low: 0,
};

export const VISIBILITY_SCORING = {
  topThreeMention: 3,
  mentionOnly: 1,
  positiveSentiment: 1,
  authoritativeCitation: 1,
  maxScore: 5,
};

export const ACTION_TYPES = [
  { value: "content_gap", label: "Content Gap" },
  { value: "citation_fix", label: "Citation Fix" },
  { value: "entity_optimization", label: "Entity Optimization" },
  { value: "competitor_response", label: "Competitor Response" },
  { value: "sentiment_repair", label: "Sentiment Repair" },
];

export const ACTION_PRIORITIES = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];
