// === Projects ===
export interface Project {
  id: string;
  name: string;
  siteUrl: string;
  brandName: string;
  industry: string;
  market: string;
  language: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  siteUrl: string;
  brandName: string;
  industry: string;
  market: string;
  language: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  siteUrl?: string;
  brandName?: string;
  industry?: string;
  market?: string;
  language?: string;
  description?: string;
}

// === Brand Profiles ===
export interface BrandProfile {
  id: string;
  projectId: string;
  entityName: string;
  aliases: string;
  competitors: string;
  targetKeywords: string;
  validated: boolean;
  validationData?: string;
  createdAt: string;
  updatedAt: string;
}

// === Personas ===
export interface Persona {
  id: string;
  projectId: string;
  name: string;
  description: string;
  demographics: string;
  searchBehavior: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonaInput {
  projectId: string;
  name: string;
  description?: string;
  demographics?: string;
  searchBehavior?: string;
}

export interface UpdatePersonaInput {
  name?: string;
  description?: string;
  demographics?: string;
  searchBehavior?: string;
}

// === Insights ===
export interface InsightsResponse {
  sources: SourceGroup[];
  trend: TrendDataPoint[];
  totalScans: number;
  avgVisibility: number;
  mentionRate: number;
}

export interface SourceGroup {
  sourceType: string;
  count: number;
  domains: string[];
}

export interface TrendDataPoint {
  date: string;
  chatgpt?: number;
  perplexity?: number;
  googleAio?: number;
}

export interface GapAnalysisResponse {
  gaps: GapItem[];
}

export interface GapItem {
  promptText: string;
  competitors: string[];
  engine: string;
}

export interface CompetitorComparisonResponse {
  brand: CompetitorData;
  competitors: CompetitorData[];
}

export interface CompetitorData {
  name: string;
  avgScore: number;
  mentionRate: number;
}

// === Prompts ===
export type IntentCategory = "informational" | "navigational" | "commercial" | "transactional" | "comparison" | "recommendation";
export type PromptStatus = "active" | "paused" | "archived";

export interface Prompt {
  id: string;
  projectId: string;
  personaId?: string;
  text: string;
  intentCategory: IntentCategory;
  status: PromptStatus;
  tags: string;
  lastRunAt?: string;
  runCount: number;
  avgScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptInput {
  projectId: string;
  text: string;
  intentCategory: string;
  tags?: string;
}

export interface UpdatePromptInput {
  text?: string;
  intentCategory?: string;
  status?: string;
  tags?: string;
}

// === Scans / Runs ===
export type ScanStatus = "pending" | "running" | "paused" | "completed" | "failed" | "cancelled";
export type AIEngine = "chatgpt" | "perplexity" | "google_aio";

export interface ScanConfig {
  engines: AIEngine[];
  markets: string[];
  languages: string[];
  geoSimulation: boolean;
  promptIds: string[];
}

export interface Scan {
  id: string;
  projectId: string;
  config: string;
  status: ScanStatus;
  progress: number;
  totalPrompts: number;
  completedPrompts: number;
  failedPrompts: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// === Raw Responses ===
export interface RawResponse {
  id: string;
  scanId: string;
  promptId: string;
  engine: AIEngine;
  market: string;
  rawText: string;
  responseTimeMs: number;
  error?: string;
  createdAt: string;
}

// === Parsed Results ===
export type SentimentLevel = "positive" | "neutral" | "negative";
export type SourceType = "owned" | "earned" | "competitor" | "neutral" | "unknown";

export interface ParsedResult {
  id: string;
  rawResponseId: string;
  scanId: string;
  promptId: string;
  engine: AIEngine;
  market: string;
  brandMentioned: boolean;
  mentionPosition: number | null;
  totalEntitiesMentioned: number;
  sentimentLevel: SentimentLevel;
  sentimentScore: number;
  visibilityScore: number;
  brandContext: string;
  competitorsMentioned: string;
  createdAt: string;
}

// === Citations ===
export interface Citation {
  id: string;
  parsedResultId: string;
  url: string;
  domain: string;
  title?: string;
  sourceType: SourceType;
  isAuthoritative: boolean;
  position: number;
  createdAt: string;
}

// === Scan Comparison ===
export interface ScanComparisonResult {
  promptId: string;
  engine: string;
  market: string;
  beforeScore: number;
  afterScore: number;
  scoreDelta: number;
  beforeMentioned: boolean;
  afterMentioned: boolean;
  beforeSentiment: string;
  afterSentiment: string;
}

export interface ScanComparison {
  beforeScanId: string;
  afterScanId: string;
  avgScoreBefore: number;
  avgScoreAfter: number;
  avgScoreDelta: number;
  mentionRateBefore: number;
  mentionRateAfter: number;
  results: ScanComparisonResult[];
}

// === Scores (aggregated) ===
export interface VisibilityScoreAggregate {
  projectId: string;
  engine: AIEngine;
  market: string;
  avgScore: number;
  mentionRate: number;
  topThreeRate: number;
  positiveSentimentRate: number;
  citationRate: number;
  shareOfVoice: number;
  promptCount: number;
  scanId: string;
  calculatedAt: string;
}

// === Action Items ===
export type ActionType = "content_gap" | "citation_fix" | "entity_optimization" | "competitor_response" | "sentiment_repair";
export type ActionPriority = "critical" | "high" | "medium" | "low";
export type ActionStatus = "open" | "in_progress" | "done" | "dismissed";

export interface ActionItem {
  id: string;
  projectId: string;
  scanId?: string;
  actionType: ActionType;
  priority: ActionPriority;
  status: ActionStatus;
  title: string;
  description: string;
  impactScore: number;
  relatedPromptIds: string;
  relatedEngine?: string;
  createdAt: string;
  updatedAt: string;
}

// === Alerts ===
export type AlertSeverity = "critical" | "warning" | "info";

export interface Alert {
  id: string;
  projectId: string;
  scanId?: string;
  alertType: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// === Brand Validation (rich) ===
export interface BrandValidationResult {
  status: "validated" | "partial" | "unrecognized";
  entityRecognized: boolean;
  category: string;
  description: string;
  confidence: number;
  knownAttributes: string[];
  relatedBusinesses: string[];
  productsServices: ProductService[];
  competitorsConfirmed: string[];
  competitorsDiscovered: string[];
  warnings: string[];
}

export interface ProductService {
  name: string;
  score: number;
  maxScore: number;
}

// === Personas (rich) ===
export interface PersonaDetail {
  id: string;
  projectId: string;
  name: string;
  age: number;
  bio: string;
  painPoints: string[];
  samplePrompts: PersonaPrompt[];
  createdAt: string;
}

export interface PersonaPrompt {
  text: string;
  intentCategory: IntentCategory;
  market: string;
  language: string;
}

// === Prompt Generation ===
export interface PromptDistribution {
  category: IntentCategory;
  label: string;
  targetPercent: number;
  count: number;
}

export interface GeneratedPromptItem {
  text: string;
  intentCategory: IntentCategory;
  personaId?: string;
  personaName?: string;
  score?: string;
}

// === Settings ===
export interface GeoSettings {
  openaiApiKey: string;
  perplexityApiKey: string;
  googleApiKey: string;
  proxy: ProxySettings;
  scan: ScanDefaults;
}

export interface ProxySettings {
  enabled: boolean;
  server: string;
  username: string;
  password: string;
  protocol: "http" | "socks5";
  /** Per-market proxy overrides. Key = market code, value = full proxy URL */
  marketProxies: Record<string, string>;
}

export interface ScanDefaults {
  defaultEngines: AIEngine[];
  defaultMarkets: string[];
  maxConcurrentScans: number;
  timeoutSeconds: number;
  autoSchedule: boolean;
  scheduleIntervalHours: number;
}
