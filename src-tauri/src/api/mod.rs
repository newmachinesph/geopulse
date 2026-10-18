pub mod openai;
pub mod perplexity;
pub mod google;

use reqwest::Client;
use serde::{Deserialize, Serialize};

/// Response from any AI engine
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineResponse {
    /// The full text response from the AI engine
    pub text: String,
    /// Any citations/sources returned by the engine (engine-level, not parsed)
    pub citations: Vec<String>,
    /// Model used for the response
    pub model: String,
    /// Response time in milliseconds
    pub response_time_ms: u64,
}

/// Errors from AI engine calls
#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("API error: {status} - {message}")]
    ApiResponse { status: u16, message: String },
    #[error("Missing API key for {engine}")]
    MissingApiKey { engine: String },
    #[error("JSON parse error: {0}")]
    Json(#[from] serde_json::Error),
}

impl ApiError {
    /// Whether this error is transient and worth retrying
    pub fn is_retryable(&self) -> bool {
        match self {
            ApiError::Http(_) => true,
            ApiError::ApiResponse { status, .. } => {
                *status == 429 || *status >= 500
            }
            _ => false,
        }
    }
}

pub type ApiResult<T> = Result<T, ApiError>;

/// Shared trait for all AI engines
#[async_trait::async_trait]
pub trait AIEngine: Send + Sync {
    /// Execute a prompt and return the engine response
    async fn execute(&self, prompt: &str, system_prompt: Option<&str>) -> ApiResult<EngineResponse>;

    /// Engine identifier (e.g., "chatgpt", "perplexity", "gemini")
    fn engine_name(&self) -> &str;
}

/// Maximum number of retry attempts for transient failures
const MAX_RETRIES: u32 = 3;

/// Execute a prompt with retry logic and exponential backoff.
/// Retries on rate limits (429) and server errors (5xx).
pub async fn execute_with_retry(
    engine: &dyn AIEngine,
    prompt: &str,
    system_prompt: Option<&str>,
) -> ApiResult<EngineResponse> {
    let mut last_error = None;

    for attempt in 0..=MAX_RETRIES {
        match engine.execute(prompt, system_prompt).await {
            Ok(response) => return Ok(response),
            Err(e) => {
                if attempt < MAX_RETRIES && e.is_retryable() {
                    let delay_ms = 1000 * 2u64.pow(attempt); // 1s, 2s, 4s
                    tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
                    last_error = Some(e);
                } else {
                    return Err(e);
                }
            }
        }
    }

    Err(last_error.unwrap())
}

/// Factory function to create an engine client by name
pub fn create_engine(engine: &str, api_key: &str, timeout_seconds: u64) -> Option<Box<dyn AIEngine>> {
    create_engine_with_proxy(engine, api_key, timeout_seconds, None)
}

/// Factory function to create an engine client with optional proxy support
pub fn create_engine_with_proxy(engine: &str, api_key: &str, timeout_seconds: u64, proxy_url: Option<&str>) -> Option<Box<dyn AIEngine>> {
    let client = build_http_client(timeout_seconds, proxy_url);
    match engine {
        "chatgpt" => Some(Box::new(openai::OpenAIClient::with_client(api_key, client))),
        "perplexity" => Some(Box::new(perplexity::PerplexityClient::with_client(api_key, client))),
        "gemini" | "google_aio" => Some(Box::new(google::GoogleClient::with_client(api_key, client))),
        _ => None,
    }
}

/// Build a reqwest client with optional proxy configuration
pub fn build_http_client(timeout_seconds: u64, proxy_url: Option<&str>) -> Client {
    let mut builder = Client::builder()
        .timeout(std::time::Duration::from_secs(timeout_seconds));

    if let Some(url) = proxy_url {
        if let Ok(proxy) = reqwest::Proxy::all(url) {
            builder = builder.proxy(proxy);
        }
    }

    builder.build().unwrap_or_default()
}
