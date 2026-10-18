use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionItem {
    pub id: String,
    pub project_id: String,
    pub scan_id: Option<String>,
    pub action_type: String,
    pub priority: String,
    pub status: String,
    pub title: String,
    pub description: String,
    pub impact_score: i64,
    pub related_prompt_ids: String,
    pub related_engine: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
