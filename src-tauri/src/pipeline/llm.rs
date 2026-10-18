use crate::api;
use crate::db::Database;
use crate::db::queries::settings as settings_queries;

/// Call an LLM with a system prompt and user prompt, return the text response.
/// Tries available engines in order (OpenAI, Gemini) and falls back on error.
pub async fn call_llm(db: &Database, system_prompt: &str, user_prompt: &str) -> Result<String, String> {
    let settings = db.with_conn(|conn| settings_queries::get_settings(conn))
        .ok()
        .flatten()
        .unwrap_or_default();

    // Build list of available engines
    let mut engines: Vec<(&str, &str)> = Vec::new();
    if !settings.openai_api_key.is_empty() {
        engines.push(("chatgpt", &settings.openai_api_key));
    }
    if !settings.google_api_key.is_empty() {
        engines.push(("gemini", &settings.google_api_key));
    }

    if engines.is_empty() {
        return Err("No API key configured. Set OpenAI or Google API key in Settings.".to_string());
    }

    let timeout = settings.scan.timeout_seconds as u64;
    let mut last_error = String::new();

    for (engine_name, api_key) in &engines {
        let engine = match api::create_engine(engine_name, api_key, timeout) {
            Some(e) => e,
            None => continue,
        };

        match engine.execute(user_prompt, Some(system_prompt)).await {
            Ok(response) => return Ok(response.text),
            Err(e) => {
                last_error = format!("{}: {}", engine_name, e);
                continue;
            }
        }
    }

    Err(format!("All engines failed. Last error: {}", last_error))
}

/// Call LLM and parse the response as JSON of type T.
/// The system prompt should instruct the model to respond with valid JSON only.
pub async fn call_llm_json<T: serde::de::DeserializeOwned>(
    db: &Database,
    system_prompt: &str,
    user_prompt: &str,
) -> Result<T, String> {
    let text = call_llm(db, system_prompt, user_prompt).await?;

    // Try to extract JSON from the response (model may wrap in ```json blocks)
    let json_str = extract_json(&text);

    serde_json::from_str::<T>(json_str)
        .map_err(|e| format!("Failed to parse LLM response as JSON: {}. Response: {}", e, &text[..text.len().min(500)]))
}

/// Extract JSON from a response that may contain markdown code fences
fn extract_json(text: &str) -> &str {
    let trimmed = text.trim();

    // Try ```json ... ``` block
    if let Some(start) = trimmed.find("```json") {
        let after_fence = &trimmed[start + 7..];
        if let Some(end) = after_fence.find("```") {
            return after_fence[..end].trim();
        }
    }

    // Try ``` ... ``` block
    if let Some(start) = trimmed.find("```") {
        let after_fence = &trimmed[start + 3..];
        if let Some(end) = after_fence.find("```") {
            return after_fence[..end].trim();
        }
    }

    // Try finding first { or [ and last } or ]
    if let Some(start) = trimmed.find(|c| c == '{' || c == '[') {
        if let Some(end) = trimmed.rfind(|c| c == '}' || c == ']') {
            return &trimmed[start..=end];
        }
    }

    trimmed
}
