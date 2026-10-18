use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Instant;

use super::{AIEngine, ApiError, ApiResult, EngineResponse};

const GEMINI_API_URL: &str = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL: &str = "gemini-2.0-flash";

pub struct GoogleClient {
    client: Client,
    api_key: String,
    model: String,
}

impl GoogleClient {
    pub fn new(api_key: &str, timeout_seconds: u64) -> Self {
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(timeout_seconds))
            .build()
            .unwrap_or_default();
        Self {
            client,
            api_key: api_key.to_string(),
            model: DEFAULT_MODEL.to_string(),
        }
    }

    pub fn with_client(api_key: &str, client: Client) -> Self {
        Self {
            client,
            api_key: api_key.to_string(),
            model: DEFAULT_MODEL.to_string(),
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct GenerateRequest {
    contents: Vec<Content>,
    #[serde(skip_serializing_if = "Option::is_none")]
    system_instruction: Option<Content>,
    generation_config: GenerationConfig,
}

#[derive(Serialize, Deserialize)]
struct Content {
    #[serde(skip_serializing_if = "Option::is_none")]
    role: Option<String>,
    parts: Vec<Part>,
}

#[derive(Serialize, Deserialize)]
struct Part {
    text: String,
}

#[derive(Serialize)]
struct GenerationConfig {
    temperature: f32,
}

#[derive(Deserialize)]
struct GenerateResponse {
    candidates: Vec<Candidate>,
    #[serde(default)]
    model_version: Option<String>,
}

#[derive(Deserialize)]
struct Candidate {
    content: Content,
    #[serde(default)]
    grounding_metadata: Option<GroundingMetadata>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GroundingMetadata {
    #[serde(default)]
    grounding_chunks: Vec<GroundingChunk>,
}

#[derive(Deserialize)]
struct GroundingChunk {
    #[serde(default)]
    web: Option<WebChunk>,
}

#[derive(Deserialize)]
struct WebChunk {
    uri: String,
}

#[derive(Deserialize)]
struct ErrorResponse {
    error: ErrorDetail,
}

#[derive(Deserialize)]
struct ErrorDetail {
    message: String,
    #[serde(default)]
    status: Option<String>,
}

#[async_trait::async_trait]
impl AIEngine for GoogleClient {
    async fn execute(&self, prompt: &str, system_prompt: Option<&str>) -> ApiResult<EngineResponse> {
        if self.api_key.is_empty() {
            return Err(ApiError::MissingApiKey { engine: "gemini".to_string() });
        }

        let url = format!(
            "{}/{}:generateContent?key={}",
            GEMINI_API_URL, self.model, self.api_key
        );

        let system_instruction = system_prompt.map(|sys| Content {
            role: None,
            parts: vec![Part { text: sys.to_string() }],
        });

        let request = GenerateRequest {
            contents: vec![Content {
                role: Some("user".to_string()),
                parts: vec![Part { text: prompt.to_string() }],
            }],
            system_instruction,
            generation_config: GenerationConfig {
                temperature: 0.7,
            },
        };

        let start = Instant::now();
        let response = self.client
            .post(&url)
            .json(&request)
            .send()
            .await?;

        let elapsed = start.elapsed().as_millis() as u64;
        let status = response.status().as_u16();

        if status != 200 {
            let body = response.text().await.unwrap_or_default();
            let message = serde_json::from_str::<ErrorResponse>(&body)
                .map(|e| e.error.message)
                .unwrap_or(body);
            return Err(ApiError::ApiResponse { status, message });
        }

        let gen_response: GenerateResponse = response.json().await?;

        let text = gen_response.candidates
            .first()
            .map(|c| {
                c.content.parts.iter()
                    .map(|p| p.text.as_str())
                    .collect::<Vec<_>>()
                    .join("")
            })
            .unwrap_or_default();

        // Extract grounding citations if available
        let citations = gen_response.candidates
            .first()
            .and_then(|c| c.grounding_metadata.as_ref())
            .map(|gm| {
                gm.grounding_chunks.iter()
                    .filter_map(|chunk| chunk.web.as_ref().map(|w| w.uri.clone()))
                    .collect()
            })
            .unwrap_or_default();

        let model = gen_response.model_version
            .unwrap_or_else(|| self.model.clone());

        Ok(EngineResponse {
            text,
            citations,
            model,
            response_time_ms: elapsed,
        })
    }

    fn engine_name(&self) -> &str {
        "gemini"
    }
}
