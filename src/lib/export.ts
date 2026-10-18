import type { ParsedResult } from "./types";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportResultsCsv(results: ParsedResult[], filename = "scan-results.csv") {
  const headers = [
    "Engine",
    "Market",
    "Brand Mentioned",
    "Mention Position",
    "Sentiment",
    "Sentiment Score",
    "Visibility Score",
    "Total Entities",
    "Competitors Mentioned",
    "Brand Context",
  ];

  const rows = results.map((r) => [
    r.engine,
    r.market,
    r.brandMentioned ? "Yes" : "No",
    r.mentionPosition != null ? String(r.mentionPosition) : "-",
    r.sentimentLevel,
    String(r.sentimentScore),
    String(r.visibilityScore),
    String(r.totalEntitiesMentioned),
    escapeCsv(r.competitorsMentioned),
    escapeCsv(r.brandContext),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadFile(csv, filename, "text/csv;charset=utf-8;");
}

export function exportResultsJson(results: ParsedResult[], filename = "scan-results.json") {
  const data = results.map((r) => ({
    engine: r.engine,
    market: r.market,
    brandMentioned: r.brandMentioned,
    mentionPosition: r.mentionPosition,
    sentimentLevel: r.sentimentLevel,
    sentimentScore: r.sentimentScore,
    visibilityScore: r.visibilityScore,
    totalEntitiesMentioned: r.totalEntitiesMentioned,
    competitorsMentioned: r.competitorsMentioned,
    brandContext: r.brandContext,
    createdAt: r.createdAt,
  }));
  downloadFile(JSON.stringify(data, null, 2), filename, "application/json;charset=utf-8;");
}

export function exportResultsTsv(results: ParsedResult[], filename = "scan-results.tsv") {
  const headers = [
    "Engine", "Market", "Brand Mentioned", "Mention Position",
    "Sentiment", "Sentiment Score", "Visibility Score",
    "Total Entities", "Competitors Mentioned", "Brand Context",
  ];

  const rows = results.map((r) => [
    r.engine,
    r.market,
    r.brandMentioned ? "Yes" : "No",
    r.mentionPosition != null ? String(r.mentionPosition) : "-",
    r.sentimentLevel,
    String(r.sentimentScore),
    String(r.visibilityScore),
    String(r.totalEntitiesMentioned),
    r.competitorsMentioned.replace(/\t/g, " "),
    r.brandContext.replace(/\t/g, " ").replace(/\n/g, " "),
  ]);

  const tsv = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
  downloadFile(tsv, filename, "text/tab-separated-values;charset=utf-8;");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
