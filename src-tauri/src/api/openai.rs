use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Instant;

use super::{AIEngine, ApiError, ApiResult, EngineResponse};

const OPENAI_API_URL: &str = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL: &str = "gpt-4o-mini";

pub struct OpenAIClient {
    client: Client,
    api_key: String,
    model: String,
}

impl OpenAIClient {
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
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
}

#[derive(Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
    model: String,
}

#[derive(Deserialize)]
struct ChatChoice {
    message: ChatMessage,
}

#[derive(Deserialize)]
struct ErrorResponse {
    error: ErrorDetail,
}

#[derive(Deserialize)]
struct ErrorDetail {
    message: String,
}

#[async_trait::async_trait]
impl AIEngine for OpenAIClient {
    async fn execute(&self, prompt: &str, system_prompt: Option<&str>) -> ApiResult<EngineResponse> {
        if self.api_key.is_empty() {
            return Err(ApiError::MissingApiKey { engine: "chatgpt".to_string() });
        }

        let mut messages = Vec::new();
        if let Some(sys) = system_prompt {
            messages.push(ChatMessage {
                role: "system".to_string(),
                content: sys.to_string(),
            });
        }
        messages.push(ChatMessage {
            role: "user".to_string(),
            content: prompt.to_string(),
        });

        let request = ChatRequest {
            model: self.model.clone(),
            messages,
            temperature: 0.7,
        };

        let start = Instant::now();
        let response = self.client
            .post(OPENAI_API_URL)
            .header("Authorization", format!("Bearer {}", self.api_key))
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

        let chat_response: ChatResponse = response.json().await?;
        let text = chat_response.choices
            .first()
            .map(|c| c.message.content.clone())
            .unwrap_or_default();

        Ok(EngineResponse {
            text,
            citations: vec![],
            model: chat_response.model,
            response_time_ms: elapsed,
        })
    }

    fn engine_name(&self) -> &str {
        "chatgpt"
    }
}
