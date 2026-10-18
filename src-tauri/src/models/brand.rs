use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrandProfile {
    pub id: String,
    pub project_id: String,
    pub entity_name: String,
    pub aliases: String,
    pub competitors: String,
    pub target_keywords: String,
    pub validated: bool,
    pub validation_data: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
