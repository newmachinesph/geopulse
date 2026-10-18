use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::queries::projects as project_queries;
use crate::models::{Project, CreateProjectInput, UpdateProjectInput};
use crate::pipeline::llm;
use crate::AppState;

#[tauri::command]
pub fn get_all_projects(state: State<AppState>) -> Result<Vec<Project>, String> {
    state.db.with_conn(|conn| project_queries::get_all_projects(conn)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_project(state: State<AppState>, id: String) -> Result<Option<Project>, String> {
    state.db.with_conn(|conn| project_queries::get_project(conn, &id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_project(state: State<AppState>, input: CreateProjectInput) -> Result<Project, String> {
    state.db.with_conn(|conn| project_queries::create_project(conn, &input)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_project(state: State<AppState>, id: String, input: UpdateProjectInput) -> Result<Option<Project>, String> {
    state.db.with_conn(|conn| project_queries::update_project(conn, &id, &input)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_project(state: State<AppState>, id: String) -> Result<bool, String> {
    state.db.with_conn(|conn| project_queries::delete_project(conn, &id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reset_application(state: State<AppState>) -> Result<bool, String> {
    state.db.with_conn(|conn| project_queries::reset_all_data(conn)).map_err(|e| e.to_string())?;
    Ok(true)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectAutofillResult {
    pub site_url: String,
    pub industry: String,
    pub market: String,
    pub description: String,
}

#[tauri::command]
pub async fn autofill_project(state: State<'_, AppState>, brand_name: String) -> Result<ProjectAutofillResult, String> {
    if brand_name.trim().is_empty() {
        return Err("Brand name is required".to_string());
    }

    let system_prompt = r#"You are a brand research assistant. Given a brand name, return factual information about it as JSON. Respond with ONLY valid JSON, no other text.

{
  "siteUrl": "https://www.example.com",
  "industry": "short industry label, e.g. SaaS, E-commerce, Healthcare",
  "market": "two-letter primary market code: us, uk, de, fr, es, it, nl, br, jp, au, ca, in, ph",
  "description": "1-2 sentence description of what the brand does"
}

Rules:
- siteUrl must be the brand's real main website URL including https://
- industry should be a short, specific label (1-3 words)
- market should be the brand's primary/home market as a two-letter code
- description should be factual and concise
- If you don't recognize the brand, make reasonable guesses based on the name"#;

    let user_prompt = format!("Look up this brand and return its details: {}", brand_name.trim());

    let db = (*state.db).clone();
    let result: ProjectAutofillResult = llm::call_llm_json(&db, system_prompt, &user_prompt).await?;

    Ok(result)
}
