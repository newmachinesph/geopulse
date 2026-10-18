use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawResponse {
    pub id: String,
    pub scan_id: String,
    pub prompt_id: String,
    pub engine: String,
    pub market: String,
    pub raw_text: String,
    pub response_time_ms: i64,
    pub error: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParsedResult {
    pub id: String,
    pub raw_response_id: String,
    pub scan_id: String,
    pub prompt_id: String,
    pub engine: String,
    pub market: String,
    pub brand_mentioned: bool,
    pub mention_position: Option<i64>,
    pub total_entities_mentioned: i64,
    pub sentiment_level: String,
    pub sentiment_score: f64,
    pub visibility_score: f64,
    pub brand_context: String,
    pub competitors_mentioned: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Citation {
    pub id: String,
    pub parsed_result_id: String,
    pub url: String,
    pub domain: String,
    pub title: Option<String>,
    pub source_type: String,
    pub is_authoritative: bool,
    pub position: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanComparisonResult {
    pub prompt_id: String,
    pub engine: String,
    pub market: String,
    pub before_score: f64,
    pub after_score: f64,
    pub score_delta: f64,
    pub before_mentioned: bool,
    pub after_mentioned: bool,
    pub before_sentiment: String,
    pub after_sentiment: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanComparison {
    pub before_scan_id: String,
    pub after_scan_id: String,
    pub avg_score_before: f64,
    pub avg_score_after: f64,
    pub avg_score_delta: f64,
    pub mention_rate_before: f64,
    pub mention_rate_after: f64,
    pub results: Vec<ScanComparisonResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VisibilityScoreAggregate {
    pub project_id: String,
    pub engine: String,
    pub market: String,
    pub avg_score: f64,
    pub mention_rate: f64,
    pub top_three_rate: f64,
    pub positive_sentiment_rate: f64,
    pub citation_rate: f64,
    pub share_of_voice: f64,
    pub prompt_count: i64,
    pub scan_id: String,
    pub calculated_at: String,
}
