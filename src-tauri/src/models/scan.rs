use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Scan {
    pub id: String,
    pub project_id: String,
    pub config: String,
    pub status: String,
    pub progress: i64,
    pub total_prompts: i64,
    pub completed_prompts: i64,
    pub failed_prompts: i64,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanConfig {
    pub engines: Vec<String>,
    pub markets: Vec<String>,
    #[serde(default)]
    pub languages: Vec<String>,
    pub geo_simulation: bool,
    #[serde(default)]
    pub prompt_ids: Vec<String>,
}
