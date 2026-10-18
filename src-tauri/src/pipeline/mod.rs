pub mod actions;
pub mod llm;
pub mod parser;
pub mod scheduler;
pub mod scorer;

use crate::api;
use crate::db::Database;
use crate::db::queries::{alerts as alert_queries, brands as brand_queries, citations as citation_queries, prompts as prompt_queries, results as result_queries, scans as scan_queries, settings as settings_queries};
use crate::models::{Citation, ParsedResult, RawResponse, ScanConfig};
use parser::BrandContext;
use scorer::ScoreInput;

/// Run a scan asynchronously. Called from the start_scan command.
/// Creates the scan in DB, fetches prompts, builds task matrix, executes, parses, scores.
pub async fn run_scan(db: Database, scan_id: String, project_id: String, config: ScanConfig) {
    // Mark scan as running
    let _ = db.with_conn(|conn| {
        scan_queries::update_scan_status(conn, &scan_id, "running")?;
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE scans SET started_at = ?1 WHERE id = ?2",
            rusqlite::params![now, scan_id],
        )?;
        Ok(())
    });

    // Load settings for API keys and timeout
    let settings = db.with_conn(|conn| settings_queries::get_settings(conn))
        .ok()
        .flatten()
        .unwrap_or_default();

    let timeout = settings.scan.timeout_seconds as u64;

    // Load brand profile for parsing context
    let brand_profile = db.with_conn(|conn| brand_queries::get_brand_profile(conn, &project_id)).ok().flatten();

    let brand_context = if let Some(ref bp) = brand_profile {
        let aliases: Vec<String> = serde_json::from_str(&bp.aliases).unwrap_or_default();
        let competitors: Vec<String> = serde_json::from_str(&bp.competitors).unwrap_or_default();
        // Get domain from the project
        let project = db.with_conn(|conn| {
            crate::db::queries::projects::get_project(conn, &project_id)
        }).ok().flatten();
        let site_domain = project.map(|p| extract_domain(&p.site_url)).unwrap_or_default();
        BrandContext {
            brand_name: bp.entity_name.clone(),
            aliases,
            competitors,
            site_domain,
        }
    } else {
        // Fallback: use project brand_name
        let project = db.with_conn(|conn| {
            crate::db::queries::projects::get_project(conn, &project_id)
        }).ok().flatten();
        BrandContext {
            brand_name: project.as_ref().map(|p| p.brand_name.clone()).unwrap_or_default(),
            aliases: vec![],
            competitors: vec![],
            site_domain: project.map(|p| extract_domain(&p.site_url)).unwrap_or_default(),
        }
    };

    // Load prompts — either specific IDs from config or all project prompts
    let prompts = if !config.prompt_ids.is_empty() {
        let mut result = Vec::new();
        for pid in &config.prompt_ids {
            if let Ok(Some(p)) = db.with_conn(|conn| prompt_queries::get_prompt(conn, pid)) {
                result.push(p);
            }
        }
        result
    } else {
        db.with_conn(|conn| prompt_queries::get_all_prompts(conn, &project_id)).unwrap_or_default()
    };

    if prompts.is_empty() {
        let _ = db.with_conn(|conn| scan_queries::update_scan_status(conn, &scan_id, "completed"));
        return;
    }

    // Build task matrix: prompt × engine × market
    let engines = &config.engines;
    let markets = &config.markets;
    let total_tasks = prompts.len() * engines.len() * markets.len();

    // Update total_prompts
    let _ = db.with_conn(|conn| {
        scan_queries::update_scan_progress(conn, &scan_id, 0, 0, total_tasks as i64)
    });

    let mut completed: i64 = 0;
    let mut failed: i64 = 0;

    // Execute each task
    for prompt in &prompts {
        for engine_name in engines {
            // Get the right API key
            let api_key = match engine_name.as_str() {
                "chatgpt" => &settings.openai_api_key,
                "perplexity" => &settings.perplexity_api_key,
                "gemini" | "google_aio" => &settings.google_api_key,
                _ => continue,
            };

            for market in markets {
                // Create engine with market-specific proxy
                let proxy_url = settings.proxy.proxy_url_for_market(market);
                let engine = match api::create_engine_with_proxy(engine_name, api_key, timeout, proxy_url.as_deref()) {
                    Some(e) => e,
                    None => {
                        failed += 1;
                        continue;
                    }
                };
                // Check if scan was cancelled
                let scan_status = db.with_conn(|conn| scan_queries::get_scan(conn, &scan_id))
                    .ok()
                    .flatten()
                    .map(|s| s.status);
                if scan_status.as_deref() == Some("cancelled") {
                    return;
                }

                // Build system prompt with market/language context
                let system_prompt = build_system_prompt(&brand_context, market, config.geo_simulation);

                // Localize prompt text for geo simulation
                let prompt_text = localize_prompt(&prompt.text, market, config.geo_simulation);

                // Execute the prompt with retry logic
                let result = api::execute_with_retry(engine.as_ref(), &prompt_text, Some(&system_prompt)).await;

                let now = chrono::Utc::now().to_rfc3339();

                match result {
                    Ok(response) => {
                        // Store raw response
                        let raw_id = uuid::Uuid::new_v4().to_string();
                        let raw_response = RawResponse {
                            id: raw_id.clone(),
                            scan_id: scan_id.clone(),
                            prompt_id: prompt.id.clone(),
                            engine: engine_name.clone(),
                            market: market.clone(),
                            raw_text: response.text.clone(),
                            response_time_ms: response.response_time_ms as i64,
                            error: None,
                            created_at: now.clone(),
                        };
                        let _ = db.with_conn(|conn| result_queries::insert_raw_response(conn, &raw_response));

                        // Parse the response
                        let parsed = parser::parse_response(&response.text, &brand_context);

                        // Combine engine-level citations with parsed URLs
                        let all_urls: Vec<String> = response.citations.iter()
                            .chain(parsed.extracted_urls.iter())
                            .cloned()
                            .collect();

                        // Check if any citation is authoritative or owned (brand's own domain)
                        let has_auth_citation = all_urls.iter().any(|url| {
                            let (source_type, is_auth) = parser::classify_citation(url, &brand_context.site_domain, &[]);
                            is_auth || source_type == "owned"
                        });

                        // Score visibility
                        let visibility_score = scorer::calculate_visibility_score(&ScoreInput {
                            brand_mentioned: parsed.brand_mentioned,
                            mention_position: parsed.mention_position,
                            sentiment_level: parsed.sentiment_level.clone(),
                            has_authoritative_citation: has_auth_citation,
                        });

                        // Store parsed result
                        let parsed_id = uuid::Uuid::new_v4().to_string();
                        let parsed_result = ParsedResult {
                            id: parsed_id.clone(),
                            raw_response_id: raw_id,
                            scan_id: scan_id.clone(),
                            prompt_id: prompt.id.clone(),
                            engine: engine_name.clone(),
                            market: market.clone(),
                            brand_mentioned: parsed.brand_mentioned,
                            mention_position: parsed.mention_position,
                            total_entities_mentioned: parsed.total_entities_mentioned,
                            sentiment_level: parsed.sentiment_level,
                            sentiment_score: parsed.sentiment_score,
                            visibility_score,
                            brand_context: parsed.brand_context_snippet,
                            competitors_mentioned: serde_json::to_string(&parsed.competitors_found).unwrap_or_else(|_| "[]".to_string()),
                            created_at: now.clone(),
                        };
                        let _ = db.with_conn(|conn| result_queries::insert_parsed_result(conn, &parsed_result));

                        // Store citations
                        let competitor_domains: Vec<String> = brand_context.competitors.iter()
                            .map(|c| c.to_lowercase().replace(' ', ""))
                            .collect();
                        for (i, url) in all_urls.iter().enumerate() {
                            let (source_type, is_authoritative) = parser::classify_citation(url, &brand_context.site_domain, &competitor_domains);
                            let domain = url.trim_start_matches("https://")
                                .trim_start_matches("http://")
                                .split('/')
                                .next()
                                .unwrap_or("")
                                .to_string();
                            let citation = Citation {
                                id: uuid::Uuid::new_v4().to_string(),
                                parsed_result_id: parsed_id.clone(),
                                url: url.clone(),
                                domain,
                                title: None,
                                source_type: source_type.to_string(),
                                is_authoritative,
                                position: i as i64,
                                created_at: now.clone(),
                            };
                            let _ = db.with_conn(|conn| citation_queries::insert_citation(conn, &citation));
                        }

                        completed += 1;
                    }
                    Err(e) => {
                        // Store raw response with error
                        let raw_response = RawResponse {
                            id: uuid::Uuid::new_v4().to_string(),
                            scan_id: scan_id.clone(),
                            prompt_id: prompt.id.clone(),
                            engine: engine_name.clone(),
                            market: market.clone(),
                            raw_text: String::new(),
                            response_time_ms: 0,
                            error: Some(e.to_string()),
                            created_at: now,
                        };
                        let _ = db.with_conn(|conn| result_queries::insert_raw_response(conn, &raw_response));
                        failed += 1;
                    }
                }

                // Update progress
                let _ = db.with_conn(|conn| {
                    scan_queries::update_scan_progress(conn, &scan_id, completed, failed, total_tasks as i64)
                });
            }
        }
    }

    // Update prompt stats (avg_score, run_count, last_run_at) from scan results
    let _ = db.with_conn(|conn| {
        prompt_queries::update_prompt_stats_from_scan(conn, &scan_id)
    });

    // Generate action items from scan results
    let _ = db.with_conn(|conn| {
        actions::generate_actions(conn, &project_id, &scan_id)
    });

    // Check for visibility drops and generate alerts
    let _ = db.with_conn(|conn| {
        check_visibility_alerts(conn, &project_id, &scan_id)
    });

    // Mark scan as completed
    let _ = db.with_conn(|conn| {
        scan_queries::update_scan_status(conn, &scan_id, "completed")?;
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE scans SET completed_at = ?1 WHERE id = ?2",
            rusqlite::params![now, scan_id],
        )?;
        Ok(())
    });
}

fn build_system_prompt(_brand: &BrandContext, market: &str, geo_simulation: bool) -> String {
    let (market_name, language) = match market {
        "us" => ("United States", "English"),
        "uk" => ("United Kingdom", "English"),
        "de" => ("Germany", "German"),
        "fr" => ("France", "French"),
        "es" => ("Spain", "Spanish"),
        "it" => ("Italy", "Italian"),
        "nl" => ("Netherlands", "Dutch"),
        "br" => ("Brazil", "Portuguese"),
        "jp" => ("Japan", "Japanese"),
        "au" => ("Australia", "English"),
        "ph" => ("Philippines", "English"),
        "ca" => ("Canada", "English"),
        "in" => ("India", "English"),
        _ => (market, "English"),
    };

    if geo_simulation {
        format!(
            "You are a helpful assistant answering questions for a user located in {}. \
             Respond in {}. Prioritize local businesses, services, and brands relevant to {}. \
             Use local conventions (currency, units, cultural references). \
             Provide comprehensive, factual answers. When relevant, mention specific products, \
             services, and brands. Include sources and citations when possible.",
            market_name, language, market_name
        )
    } else {
        format!(
            "You are a helpful assistant answering questions for users in {}. \
             Provide comprehensive, factual answers. When relevant, mention specific products, \
             services, and brands. Include sources and citations when possible.",
            market_name
        )
    }
}

/// Localize a prompt for a specific market when geo simulation is enabled.
fn localize_prompt(prompt_text: &str, market: &str, geo_simulation: bool) -> String {
    if !geo_simulation {
        return prompt_text.to_string();
    }

    let locale_suffix = match market {
        "us" => " (in the United States)",
        "uk" => " (in the United Kingdom)",
        "de" => " (in Deutschland)",
        "fr" => " (en France)",
        "es" => " (en España)",
        "it" => " (in Italia)",
        "nl" => " (in Nederland)",
        "br" => " (no Brasil)",
        "jp" => " (日本で)",
        "au" => " (in Australia)",
        "ph" => " (in the Philippines)",
        "ca" => " (in Canada)",
        "in" => " (in India)",
        _ => "",
    };

    format!("{}{}", prompt_text, locale_suffix)
}

fn extract_domain(url: &str) -> String {
    url.trim_start_matches("https://")
        .trim_start_matches("http://")
        .trim_start_matches("www.")
        .split('/')
        .next()
        .unwrap_or("")
        .to_string()
}

/// Check if the latest scan shows a visibility drop compared to the previous scan.
/// Generates alerts for significant drops (>= 0.5 avg score or >= 10% mention rate).
fn check_visibility_alerts(conn: &rusqlite::Connection, project_id: &str, scan_id: &str) -> rusqlite::Result<()> {
    // Get the two most recent completed scans for this project
    let scans = scan_queries::get_scans(conn, project_id)?;
    let completed: Vec<_> = scans.iter().filter(|s| s.status == "completed" || s.id == scan_id).collect();

    if completed.len() < 2 {
        return Ok(());
    }

    let current_scan_id = &completed[0].id;
    let previous_scan_id = &completed[1].id;

    let current_results = result_queries::get_parsed_results(conn, current_scan_id)?;
    let previous_results = result_queries::get_parsed_results(conn, previous_scan_id)?;

    if current_results.is_empty() || previous_results.is_empty() {
        return Ok(());
    }

    let current_avg = current_results.iter().map(|r| r.visibility_score).sum::<f64>() / current_results.len() as f64;
    let previous_avg = previous_results.iter().map(|r| r.visibility_score).sum::<f64>() / previous_results.len() as f64;
    let score_delta = current_avg - previous_avg;

    let current_mention = current_results.iter().filter(|r| r.brand_mentioned).count() as f64 / current_results.len() as f64;
    let previous_mention = previous_results.iter().filter(|r| r.brand_mentioned).count() as f64 / previous_results.len() as f64;
    let mention_delta = current_mention - previous_mention;

    // Alert on significant visibility score drop
    if score_delta <= -0.5 {
        let severity = if score_delta <= -1.0 { "critical" } else { "warning" };
        let title = format!("Visibility score dropped by {:.1}", score_delta.abs());
        let message = format!(
            "Average visibility score decreased from {:.2} to {:.2} ({:.1} drop). Review recent content changes and competitor activity.",
            previous_avg, current_avg, score_delta.abs()
        );
        let _ = alert_queries::create_alert(conn, project_id, Some(scan_id), "visibility_drop", severity, &title, &message);
    }

    // Alert on mention rate drop
    if mention_delta <= -0.10 {
        let severity = if mention_delta <= -0.20 { "critical" } else { "warning" };
        let title = format!("Brand mention rate dropped by {:.0}%", (mention_delta.abs() * 100.0));
        let message = format!(
            "Brand mention rate decreased from {:.0}% to {:.0}%. Consider updating brand entity optimization.",
            previous_mention * 100.0, current_mention * 100.0
        );
        let _ = alert_queries::create_alert(conn, project_id, Some(scan_id), "mention_drop", severity, &title, &message);
    }

    Ok(())
}
