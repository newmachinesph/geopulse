use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Prompt {
    pub id: String,
    pub project_id: String,
    pub persona_id: Option<String>,
    pub text: String,
    pub intent_category: String,
    pub status: String,
    pub tags: String,
    pub last_run_at: Option<String>,
    pub run_count: i64,
    pub avg_score: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePromptInput {
    pub project_id: String,
    pub text: String,
    pub intent_category: String,
    pub tags: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePromptInput {
    pub text: Option<String>,
    pub intent_category: Option<String>,
    pub status: Option<String>,
    pub tags: Option<String>,
}
