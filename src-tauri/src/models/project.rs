use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub site_url: String,
    pub brand_name: String,
    pub industry: String,
    pub market: String,
    pub language: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectInput {
    pub name: String,
    pub site_url: String,
    pub brand_name: String,
    pub industry: String,
    pub market: String,
    pub language: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProjectInput {
    pub name: Option<String>,
    pub site_url: Option<String>,
    pub brand_name: Option<String>,
    pub industry: Option<String>,
    pub market: Option<String>,
    pub language: Option<String>,
    pub description: Option<String>,
}
