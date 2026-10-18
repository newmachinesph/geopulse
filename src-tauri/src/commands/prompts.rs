use tauri::State;
use crate::db::queries::{brands as brand_queries, prompts as prompt_queries};
use crate::models::{Prompt, CreatePromptInput, UpdatePromptInput};
use crate::pipeline::llm;
use crate::AppState;

#[tauri::command]
pub fn get_prompts(state: State<AppState>, project_id: String) -> Result<Vec<Prompt>, String> {
    state.db.with_conn(|conn| prompt_queries::get_prompts(conn, &project_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_prompt(state: State<AppState>, id: String) -> Result<Option<Prompt>, String> {
    state.db.with_conn(|conn| prompt_queries::get_prompt(conn, &id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_prompt(state: State<AppState>, input: CreatePromptInput) -> Result<Prompt, String> {
    state.db.with_conn(|conn| prompt_queries::create_prompt(conn, &input)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_prompt(state: State<AppState>, id: String, input: UpdatePromptInput) -> Result<Option<Prompt>, String> {
    state.db.with_conn(|conn| prompt_queries::update_prompt(conn, &id, &input)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_prompt(state: State<AppState>, id: String) -> Result<bool, String> {
    state.db.with_conn(|conn| prompt_queries::delete_prompt(conn, &id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_prompts(state: State<AppState>, project_id: String) -> Result<usize, String> {
    state.db.with_conn(|conn| prompt_queries::clear_prompts(conn, &project_id)).map_err(|e| e.to_string())
}

#[derive(serde::Deserialize)]
struct GeneratedPromptItem {
    text: String,
    #[serde(rename = "intentCategory")]
    intent_category: String,
}

#[tauri::command]
pub async fn generate_prompts(state: State<'_, AppState>, project_id: String, intent_category: String) -> Result<Vec<Prompt>, String> {
    // Load brand context for prompt generation
    let profile = state.db.with_conn(|conn| brand_queries::get_brand_profile(conn, &project_id))
        .map_err(|e| e.to_string())?;

    let project = state.db.with_conn(|conn| {
        crate::db::queries::projects::get_project(conn, &project_id)
    }).map_err(|e| e.to_string())?;

    let brand_name = profile.as_ref()
        .map(|p| p.entity_name.clone())
        .or_else(|| project.as_ref().map(|p| p.brand_name.clone()))
        .unwrap_or_else(|| "the brand".to_string());

    let industry = project.as_ref().map(|p| p.industry.clone()).unwrap_or_default();

    let competitors: Vec<String> = profile.as_ref()
        .map(|p| serde_json::from_str(&p.competitors).unwrap_or_default())
        .unwrap_or_default();

    let keywords: Vec<String> = profile.as_ref()
        .map(|p| serde_json::from_str(&p.target_keywords).unwrap_or_default())
        .unwrap_or_default();

    let category_filter = if intent_category.is_empty() || intent_category == "all" {
        "a mix of informational, commercial, comparison, transactional, and recommendation intents".to_string()
    } else {
        format!("primarily '{}' intent", intent_category)
    };

    let system_prompt = r#"You are a GEO (Generative Engine Optimization) expert. Generate search prompts that real users would type into AI assistants like ChatGPT, Perplexity, or Google AI. Return ONLY a valid JSON array of objects with "text" and "intentCategory" fields. No other text.

Intent categories: informational, navigational, commercial, transactional, comparison, recommendation

Example output:
[
  {"text": "What is the best CRM for small businesses?", "intentCategory": "commercial"},
  {"text": "Compare Salesforce vs HubSpot for startups", "intentCategory": "comparison"}
]"#;

    let user_prompt = format!(
        "Generate 10 search prompts for GEO monitoring.\n\
        Brand: {}\n\
        Industry: {}\n\
        Competitors: {}\n\
        Keywords: {}\n\
        Focus: {}\n\n\
        Generate diverse, natural prompts that real users would ask AI assistants. \
        Include the brand name in some but not all prompts. \
        Cover different angles: best products, comparisons, reviews, how-to, alternatives.",
        brand_name,
        industry,
        competitors.join(", "),
        keywords.join(", "),
        category_filter,
    );

    let db = (*state.db).clone();
    let generated: Vec<GeneratedPromptItem> = llm::call_llm_json(&db, system_prompt, &user_prompt).await?;

    // Insert generated prompts into DB
    let mut prompts = Vec::new();
    for item in generated {
        let input = CreatePromptInput {
            project_id: project_id.clone(),
            text: item.text,
            intent_category: item.intent_category,
            tags: Some("[]".to_string()),
        };
        match state.db.with_conn(|conn| prompt_queries::create_prompt(conn, &input)) {
            Ok(prompt) => prompts.push(prompt),
            Err(e) => eprintln!("Failed to insert generated prompt: {}", e),
        }
    }

    Ok(prompts)
}
