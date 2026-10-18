use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Alert {
    pub id: String,
    pub project_id: String,
    pub scan_id: Option<String>,
    pub alert_type: String,
    pub severity: String,
    pub title: String,
    pub message: String,
    pub is_read: bool,
    pub created_at: String,
}
