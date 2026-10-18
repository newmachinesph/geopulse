use tauri::State;
use crate::db::queries::{brands as brand_queries, personas as persona_queries};
use crate::models::{Persona, CreatePersonaInput, UpdatePersonaInput};
use crate::pipeline::llm;
use crate::AppState;

#[tauri::command]
pub fn get_personas(state: State<AppState>, project_id: String) -> Result<Vec<Persona>, String> {
    state.db.with_conn(|conn| persona_queries::get_personas(conn, &project_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_persona(state: State<AppState>, id: String) -> Result<Option<Persona>, String> {
    state.db.with_conn(|conn| persona_queries::get_persona(conn, &id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_persona(state: State<AppState>, input: CreatePersonaInput) -> Result<Persona, String> {
    state.db.with_conn(|conn| {
        persona_queries::create_persona(
            conn,
            &input.project_id,
            &input.name,
            input.description.as_deref().unwrap_or(""),
            input.demographics.as_deref().unwrap_or("{}"),
            input.search_behavior.as_deref().unwrap_or("{}"),
        )
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_persona(state: State<AppState>, id: String, input: UpdatePersonaInput) -> Result<Option<Persona>, String> {
    state.db.with_conn(|conn| {
        persona_queries::update_persona(
            conn,
            &id,
            input.name.as_deref(),
            input.description.as_deref(),
            input.demographics.as_deref(),
            input.search_behavior.as_deref(),
        )
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_persona(state: State<AppState>, id: String) -> Result<bool, String> {
    state.db.with_conn(|conn| persona_queries::delete_persona(conn, &id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_personas(state: State<AppState>, project_id: String) -> Result<usize, String> {
    state.db.with_conn(|conn| persona_queries::clear_personas(conn, &project_id)).map_err(|e| e.to_string())
}

#[derive(serde::Deserialize)]
struct GeneratedPersona {
    name: String,
    age: i32,
    bio: String,
    #[serde(rename = "painPoints")]
    pain_points: Vec<String>,
    #[serde(rename = "samplePrompts")]
    sample_prompts: Vec<GeneratedPersonaPrompt>,
}

#[derive(serde::Deserialize, serde::Serialize)]
struct GeneratedPersonaPrompt {
    text: String,
    #[serde(rename = "intentCategory")]
    intent_category: String,
    market: String,
    language: String,
}

#[derive(serde::Serialize)]
struct SearchBehavior {
    #[serde(rename = "painPoints")]
    pain_points: Vec<String>,
    #[serde(rename = "samplePrompts")]
    sample_prompts: Vec<GeneratedPersonaPrompt>,
}

#[derive(serde::Serialize)]
struct Demographics {
    age: i32,
    bio: String,
}

#[tauri::command]
pub async fn generate_personas(state: State<'_, AppState>, project_id: String) -> Result<Vec<Persona>, String> {
    // Load brand context
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
    let site_url = project.as_ref().map(|p| p.site_url.clone()).unwrap_or_default();

    let competitors: Vec<String> = profile.as_ref()
        .map(|p| serde_json::from_str(&p.competitors).unwrap_or_default())
        .unwrap_or_default();

    let system_prompt = r#"You are a customer persona expert for GEO (Generative Engine Optimization). Generate realistic customer personas who would search for products/services in the given industry using AI assistants. Return ONLY a valid JSON array of persona objects. No other text.

Each persona must have:
{
  "name": "First name",
  "age": 25-60,
  "bio": "2-3 sentence description of who they are and what they need",
  "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
  "samplePrompts": [
    {"text": "natural search query", "intentCategory": "commercial|informational|comparison|transactional|recommendation", "market": "us", "language": "en"}
  ]
}

Generate 3 diverse personas with 3 sample prompts each."#;

    let user_prompt = format!(
        "Generate customer personas for:\n\
        Brand: {}\n\
        Website: {}\n\
        Industry: {}\n\
        Competitors: {}\n\n\
        Create 3 realistic personas who would search for this type of product/service \
        using AI assistants like ChatGPT or Perplexity. Each persona should have different \
        demographics, needs, and search behaviors.",
        brand_name, site_url, industry, competitors.join(", "),
    );

    let db = (*state.db).clone();
    let generated: Vec<GeneratedPersona> = llm::call_llm_json(&db, system_prompt, &user_prompt).await?;

    // Insert generated personas into DB
    let mut personas = Vec::new();
    for item in generated {
        let demographics = serde_json::to_string(&Demographics {
            age: item.age,
            bio: item.bio.clone(),
        }).unwrap_or_else(|_| "{}".to_string());

        let search_behavior = serde_json::to_string(&SearchBehavior {
            pain_points: item.pain_points,
            sample_prompts: item.sample_prompts,
        }).unwrap_or_else(|_| "{}".to_string());

        match state.db.with_conn(|conn| {
            persona_queries::create_persona(
                conn,
                &project_id,
                &item.name,
                &item.bio,
                &demographics,
                &search_behavior,
            )
        }) {
            Ok(persona) => personas.push(persona),
            Err(e) => eprintln!("Failed to insert generated persona: {}", e),
        }
    }

    Ok(personas)
}
