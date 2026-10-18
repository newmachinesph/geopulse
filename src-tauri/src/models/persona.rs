use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Persona {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: String,
    pub demographics: String,
    pub search_behavior: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePersonaInput {
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub demographics: Option<String>,
    pub search_behavior: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePersonaInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub demographics: Option<String>,
    pub search_behavior: Option<String>,
}
