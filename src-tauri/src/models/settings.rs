use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct GeoSettings {
    pub openai_api_key: String,
    pub perplexity_api_key: String,
    pub google_api_key: String,
    pub proxy: ProxySettings,
    pub scan: ScanDefaults,
}

impl Default for GeoSettings {
    fn default() -> Self {
        Self {
            openai_api_key: String::new(),
            perplexity_api_key: String::new(),
            google_api_key: String::new(),
            proxy: ProxySettings::default(),
            scan: ScanDefaults::default(),
        }
    }
}


#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ProxySettings {
    pub enabled: bool,
    pub server: String,
    pub username: String,
    pub password: String,
    pub protocol: String,
    /// Per-market proxy overrides. Key = market code (e.g. "de"), value = proxy URL.
    pub market_proxies: std::collections::HashMap<String, String>,
}

impl Default for ProxySettings {
    fn default() -> Self {
        Self {
            enabled: false,
            server: String::new(),
            username: String::new(),
            password: String::new(),
            protocol: "http".to_string(),
            market_proxies: std::collections::HashMap::new(),
        }
    }
}

impl ProxySettings {
    /// Build a proxy URL from the default settings.
    pub fn proxy_url(&self) -> Option<String> {
        if !self.enabled || self.server.is_empty() {
            return None;
        }
        let auth = if !self.username.is_empty() {
            if !self.password.is_empty() {
                format!("{}:{}@", self.username, self.password)
            } else {
                format!("{}@", self.username)
            }
        } else {
            String::new()
        };
        Some(format!("{}://{}{}", self.protocol, auth, self.server))
    }

    /// Get the proxy URL for a specific market (per-market override or default).
    pub fn proxy_url_for_market(&self, market: &str) -> Option<String> {
        if !self.enabled {
            return None;
        }
        if let Some(market_proxy) = self.market_proxies.get(market) {
            if !market_proxy.is_empty() {
                return Some(market_proxy.clone());
            }
        }
        self.proxy_url()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ScanDefaults {
    pub default_engines: Vec<String>,
    pub default_markets: Vec<String>,
    pub max_concurrent_scans: i64,
    pub timeout_seconds: i64,
    pub auto_schedule: bool,
    pub schedule_interval_hours: i64,
}

impl Default for ScanDefaults {
    fn default() -> Self {
        Self {
            default_engines: vec!["chatgpt".to_string(), "gemini".to_string()],
            default_markets: vec!["us".to_string()],
            max_concurrent_scans: 3,
            timeout_seconds: 30,
            auto_schedule: false,
            schedule_interval_hours: 24,
        }
    }
}
