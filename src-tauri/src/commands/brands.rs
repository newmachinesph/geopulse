use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::queries::brands as brand_queries;
use crate::models::BrandProfile;
use crate::pipeline::llm;
use crate::AppState;

/// Convert a comma-separated string to a JSON array string.
/// If the input is already a valid JSON array, pass it through unchanged.
fn to_json_array(input: &str) -> String {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return "[]".to_string();
    }
    // If it's already a valid JSON array, return as-is
    if let Ok(arr) = serde_json::from_str::<Vec<String>>(trimmed) {
        return serde_json::to_string(&arr).unwrap_or_else(|_| "[]".to_string());
    }
    // Otherwise split by comma, trim each item, filter empty
    let items: Vec<String> = trimmed
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
    serde_json::to_string(&items).unwrap_or_else(|_| "[]".to_string())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveBrandInput {
    pub project_id: String,
    pub entity_name: String,
    #[serde(default)]
    pub aliases: String,
    #[serde(default)]
    pub competitors: String,
    #[serde(default)]
    pub target_keywords: String,
}

#[tauri::command]
pub fn get_brand_profile(state: State<AppState>, project_id: String) -> Result<Option<BrandProfile>, String> {
    state.db.with_conn(|conn| brand_queries::get_brand_profile(conn, &project_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_brand_profile(state: State<AppState>, input: SaveBrandInput) -> Result<BrandProfile, String> {
    // Check if a profile already exists for this project
    let existing = state.db.with_conn(|conn| brand_queries::get_brand_profile(conn, &input.project_id))
        .map_err(|e| e.to_string())?;

    // Convert comma-separated strings to JSON arrays for consistent storage
    let aliases = to_json_array(&input.aliases);
    let competitors = to_json_array(&input.competitors);
    let target_keywords = to_json_array(&input.target_keywords);

    let profile = BrandProfile {
        id: existing.as_ref().map(|p| p.id.clone()).unwrap_or_else(|| uuid::Uuid::new_v4().to_string()),
        project_id: input.project_id,
        entity_name: input.entity_name,
        aliases,
        competitors,
        target_keywords,
        validated: existing.as_ref().map(|p| p.validated).unwrap_or(false),
        validation_data: existing.and_then(|p| p.validation_data),
        created_at: String::new(),
        updated_at: String::new(),
    };

    state.db.with_conn(|conn| brand_queries::save_brand_profile(conn, &profile)).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn validate_brand_entity(state: State<'_, AppState>, project_id: String) -> Result<String, String> {
    // Load brand profile to get entity name and competitors
    let profile = state.db.with_conn(|conn| brand_queries::get_brand_profile(conn, &project_id))
        .map_err(|e| e.to_string())?;

    let profile = match profile {
        Some(p) => p,
        None => return Err("No brand profile found. Save a brand profile first.".to_string()),
    };

    let project = state.db.with_conn(|conn| {
        crate::db::queries::projects::get_project(conn, &project_id)
    }).map_err(|e| e.to_string())?;

    let site_url = project.map(|p| p.site_url).unwrap_or_default();
    let competitors: Vec<String> = serde_json::from_str(&profile.competitors).unwrap_or_default();

    let system_prompt = r#"You are a brand intelligence analyst. Analyze the given brand entity and return a JSON object with the following structure. Respond with ONLY valid JSON, no other text.

{
  "status": "validated" | "partial" | "unrecognized",
  "entityRecognized": true/false,
  "category": "industry/category string",
  "description": "2-3 sentence description of the brand",
  "confidence": 0-100,
  "knownAttributes": ["attribute1", "attribute2"],
  "relatedBusinesses": ["business1", "business2"],
  "productsServices": [{"name": "product", "score": 1-10, "maxScore": 10}],
  "competitorsConfirmed": ["confirmed competitor names from the provided list"],
  "competitorsDiscovered": ["additional competitors not in the provided list"],
  "warnings": ["any warnings or concerns"]
}"#;

    let user_prompt = format!(
        "Analyze this brand:\n\
        - Entity Name: {}\n\
        - Website: {}\n\
        - Aliases: {}\n\
        - Known Competitors: {}\n\
        - Target Keywords: {}\n\n\
        Validate whether this is a real, recognized brand entity. \
        Identify its industry, products/services, and confirm or discover competitors.",
        profile.entity_name,
        site_url,
        profile.aliases,
        competitors.join(", "),
        profile.target_keywords,
    );

    let db = (*state.db).clone();
    let result = llm::call_llm(&db, system_prompt, &user_prompt).await?;

    // Store validation data in brand profile
    let _ = state.db.with_conn(|conn| {
        conn.execute(
            "UPDATE brand_profiles SET validation_data = ?1, validated = 1, updated_at = ?2 WHERE project_id = ?3",
            rusqlite::params![result, chrono::Utc::now().to_rfc3339(), project_id],
        )
    });

    Ok(result)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrandAutofillResult {
    pub entity_name: String,
    pub aliases: Vec<String>,
    pub competitors: Vec<String>,
    pub target_keywords: Vec<String>,
}

#[tauri::command]
pub async fn autofill_brand_profile(state: State<'_, AppState>, project_id: String) -> Result<BrandAutofillResult, String> {
    let project = state.db.with_conn(|conn| {
        crate::db::queries::projects::get_project(conn, &project_id)
    }).map_err(|e| e.to_string())?;

    let project = match project {
        Some(p) => p,
        None => return Err("Project not found".to_string()),
    };

    let system_prompt = r#"You are a GEO (Generative Engine Optimization) brand analyst. Given a brand and its context, suggest brand configuration for AI visibility monitoring. Return ONLY valid JSON, no other text.

{
  "entityName": "Exact brand entity name as it should appear in AI responses",
  "aliases": ["alternate names", "abbreviations", "common misspellings"],
  "competitors": ["top 5-8 direct competitors in the same space"],
  "targetKeywords": ["8-12 high-intent keywords users would search AI assistants for"]
}

Focus on keywords that real users would type into ChatGPT, Perplexity, or Google AI Overviews when looking for products/services in this industry."#;

    let user_prompt = format!(
        "Suggest brand configuration for AI visibility monitoring:\n\
        - Brand Name: {}\n\
        - Website: {}\n\
        - Industry: {}\n\
        - Market: {}\n\
        - Description: {}",
        project.brand_name,
        project.site_url,
        project.industry,
        project.market,
        project.description.as_deref().unwrap_or(""),
    );

    let db = (*state.db).clone();
    let result: BrandAutofillResult = llm::call_llm_json(&db, system_prompt, &user_prompt).await?;

    Ok(result)
}
