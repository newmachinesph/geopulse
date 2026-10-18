use rusqlite::{params, Connection};
use serde::Serialize;

/// A prompt where the brand is absent but competitors are present
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GapItem {
    pub prompt_text: String,
    pub competitors: Vec<String>,
    pub engine: String,
}

/// Brand or competitor aggregate data
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompetitorData {
    pub name: String,
    pub avg_score: f64,
    pub mention_rate: f64,
}

/// Source coverage group
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceGroup {
    pub source_type: String,
    pub count: i64,
    pub domains: Vec<String>,
}

/// Trend data point per scan
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrendDataPoint {
    pub date: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chatgpt: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub perplexity: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub google_aio: Option<f64>,
}

/// Full gap analysis response
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GapAnalysisResponse {
    pub gaps: Vec<GapItem>,
}

/// Full competitor comparison response
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompetitorComparisonResponse {
    pub brand: CompetitorData,
    pub competitors: Vec<CompetitorData>,
}

/// Full insights response
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InsightsResponse {
    pub sources: Vec<SourceGroup>,
    pub trend: Vec<TrendDataPoint>,
    pub total_scans: i64,
    pub avg_visibility: f64,
    pub mention_rate: f64,
}

/// Find prompts where brand was NOT mentioned (content gaps).
/// Includes competitor info when available. Uses the latest scan.
pub fn get_gap_analysis(conn: &Connection, project_id: &str) -> rusqlite::Result<GapAnalysisResponse> {
    let latest_scan_id: Option<String> = conn.query_row(
        "SELECT id FROM scans WHERE project_id = ?1 AND status = 'completed' ORDER BY created_at DESC LIMIT 1",
        params![project_id],
        |row| row.get(0),
    ).ok();

    let scan_id = match latest_scan_id {
        Some(id) => id,
        None => return Ok(GapAnalysisResponse { gaps: vec![] }),
    };

    // Find all parsed results where brand was NOT mentioned
    let mut stmt = conn.prepare(
        "SELECT p.text, pr.competitors_mentioned, pr.engine
         FROM parsed_results pr
         JOIN prompts p ON pr.prompt_id = p.id
         WHERE pr.scan_id = ?1
           AND pr.brand_mentioned = 0
         ORDER BY pr.visibility_score ASC, p.text"
    )?;

    let rows = stmt.query_map(params![scan_id], |row| {
        let text: String = row.get(0)?;
        let competitors_json: String = row.get(1)?;
        let engine: String = row.get(2)?;
        Ok((text, competitors_json, engine))
    })?;

    let mut gaps = Vec::new();
    let mut seen = std::collections::HashSet::new();
    for row in rows {
        let (text, competitors_json, engine) = row?;
        let key = format!("{}|{}", text, engine);
        if seen.contains(&key) { continue; }
        seen.insert(key);
        let competitors: Vec<String> = serde_json::from_str(&competitors_json).unwrap_or_default();
        gaps.push(GapItem {
            prompt_text: text,
            competitors,
            engine,
        });
    }

    Ok(GapAnalysisResponse { gaps })
}

/// Compare brand visibility against competitors using the latest scan.
/// Includes all configured competitors from brand profile, even if not mentioned.
pub fn get_competitor_comparison(conn: &Connection, project_id: &str) -> rusqlite::Result<CompetitorComparisonResponse> {
    let latest_scan_id: Option<String> = conn.query_row(
        "SELECT id FROM scans WHERE project_id = ?1 AND status = 'completed' ORDER BY created_at DESC LIMIT 1",
        params![project_id],
        |row| row.get(0),
    ).ok();

    // Get brand name from project
    let brand_name: String = conn.query_row(
        "SELECT brand_name FROM projects WHERE id = ?1",
        params![project_id],
        |row| row.get(0),
    ).unwrap_or_else(|_| "Your Brand".to_string());

    // Load configured competitors from brand profile
    let configured_competitors: Vec<String> = conn.query_row(
        "SELECT competitors FROM brand_profiles WHERE project_id = ?1",
        params![project_id],
        |row| row.get::<_, String>(0),
    ).ok()
        .and_then(|json| serde_json::from_str::<Vec<String>>(&json).ok())
        .unwrap_or_default();

    let scan_id = match latest_scan_id {
        Some(id) => id,
        None => {
            // No scan yet — return brand + configured competitors with 0 data
            let competitors = configured_competitors.into_iter()
                .map(|name| CompetitorData { name, avg_score: 0.0, mention_rate: 0.0 })
                .collect();
            return Ok(CompetitorComparisonResponse {
                brand: CompetitorData { name: brand_name, avg_score: 0.0, mention_rate: 0.0 },
                competitors,
            });
        }
    };

    // Brand aggregate
    let (brand_avg, brand_mention_rate, total_results) = conn.query_row(
        "SELECT
            COALESCE(AVG(visibility_score), 0.0),
            COALESCE(AVG(CASE WHEN brand_mentioned = 1 THEN 1.0 ELSE 0.0 END), 0.0),
            COUNT(*)
         FROM parsed_results WHERE scan_id = ?1",
        params![scan_id],
        |row| Ok((row.get::<_, f64>(0)?, row.get::<_, f64>(1)?, row.get::<_, i64>(2)?)),
    ).unwrap_or((0.0, 0.0, 0));

    let brand = CompetitorData {
        name: brand_name,
        avg_score: brand_avg,
        mention_rate: brand_mention_rate,
    };

    // Competitor aggregates from scan results
    let mut competitor_mentions: std::collections::HashMap<String, (i64, i64)> = std::collections::HashMap::new();

    let mut stmt = conn.prepare(
        "SELECT competitors_mentioned FROM parsed_results WHERE scan_id = ?1"
    )?;
    let rows = stmt.query_map(params![scan_id], |row| {
        let json: String = row.get(0)?;
        Ok(json)
    })?;

    for row in rows {
        let json = row?;
        let competitors: Vec<String> = serde_json::from_str(&json).unwrap_or_default();
        let mut seen_in_result = std::collections::HashSet::new();
        for comp in competitors {
            seen_in_result.insert(comp);
        }
        for comp in &seen_in_result {
            let entry = competitor_mentions.entry(comp.clone()).or_insert((0, 0));
            entry.0 += 1;
            entry.1 = total_results;
        }
    }

    // Build competitor list: include all configured competitors + any discovered ones
    let mut all_competitor_names: Vec<String> = configured_competitors.clone();
    for name in competitor_mentions.keys() {
        if !all_competitor_names.iter().any(|c| c.to_lowercase() == name.to_lowercase()) {
            all_competitor_names.push(name.clone());
        }
    }

    let mut competitors: Vec<CompetitorData> = all_competitor_names.into_iter()
        .map(|name| {
            // Find mention data (case-insensitive match)
            let (mentioned, total) = competitor_mentions.iter()
                .find(|(k, _)| k.to_lowercase() == name.to_lowercase())
                .map(|(_, v)| *v)
                .unwrap_or((0, total_results));
            let mention_rate = if total > 0 { mentioned as f64 / total as f64 } else { 0.0 };
            CompetitorData {
                name,
                avg_score: mention_rate * 5.0, // Scale mention rate to 0-5 score range for visualization
                mention_rate,
            }
        })
        .collect();

    competitors.sort_by(|a, b| b.mention_rate.partial_cmp(&a.mention_rate).unwrap_or(std::cmp::Ordering::Equal));

    Ok(CompetitorComparisonResponse { brand, competitors })
}

/// Get full insights: source coverage + trend data.
pub fn get_insights(conn: &Connection, project_id: &str) -> rusqlite::Result<InsightsResponse> {
    // --- Source coverage from citations ---
    let mut source_map: std::collections::HashMap<String, Vec<String>> = std::collections::HashMap::new();

    let mut stmt = conn.prepare(
        "SELECT c.source_type, c.domain
         FROM citations c
         JOIN parsed_results pr ON c.parsed_result_id = pr.id
         JOIN scans s ON pr.scan_id = s.id
         WHERE s.project_id = ?1
         ORDER BY c.source_type"
    )?;
    let rows = stmt.query_map(params![project_id], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;

    for row in rows {
        let (source_type, domain) = row?;
        let domains = source_map.entry(source_type).or_default();
        if !domains.contains(&domain) {
            domains.push(domain);
        }
    }

    let mut sources: Vec<SourceGroup> = source_map.into_iter()
        .map(|(source_type, domains)| {
            let count = domains.len() as i64;
            SourceGroup { source_type, count, domains }
        })
        .collect();

    // If no citation data, fall back to engine-level coverage breakdown
    if sources.is_empty() {
        let mut stmt = conn.prepare(
            "SELECT pr.engine, COUNT(*) as cnt,
                    SUM(CASE WHEN pr.brand_mentioned = 1 THEN 1 ELSE 0 END) as mentioned
             FROM parsed_results pr
             JOIN scans s ON pr.scan_id = s.id
             WHERE s.project_id = ?1
             GROUP BY pr.engine
             ORDER BY cnt DESC"
        )?;
        let rows = stmt.query_map(params![project_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?, row.get::<_, i64>(2)?))
        })?;
        for row in rows {
            let (engine, total, mentioned) = row?;
            let label = match engine.as_str() {
                "chatgpt" => "ChatGPT",
                "gemini" | "google_aio" => "Google AIO",
                "perplexity" => "Perplexity",
                _ => &engine,
            };
            sources.push(SourceGroup {
                source_type: label.to_string(),
                count: total,
                domains: vec![format!("{} brand mentions", mentioned)],
            });
        }
    }

    // --- Trend data by scan (avg visibility score per engine per scan date) ---
    let mut stmt = conn.prepare(
        "SELECT s.created_at, pr.engine, AVG(pr.visibility_score) as avg_score
         FROM parsed_results pr
         JOIN scans s ON pr.scan_id = s.id
         WHERE s.project_id = ?1 AND s.status = 'completed'
         GROUP BY s.id, pr.engine
         ORDER BY s.created_at"
    )?;

    let rows = stmt.query_map(params![project_id], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, f64>(2)?))
    })?;

    // Group by date
    let mut trend_map: std::collections::BTreeMap<String, TrendDataPoint> = std::collections::BTreeMap::new();
    for row in rows {
        let (date, engine, avg_score) = row?;
        // Truncate to date only (YYYY-MM-DD)
        let date_key = date.chars().take(10).collect::<String>();
        let point = trend_map.entry(date_key.clone()).or_insert(TrendDataPoint {
            date: date_key,
            chatgpt: None,
            perplexity: None,
            google_aio: None,
        });
        match engine.as_str() {
            "chatgpt" => point.chatgpt = Some(avg_score),
            "perplexity" => point.perplexity = Some(avg_score),
            "gemini" | "google_aio" => point.google_aio = Some(avg_score),
            _ => {}
        }
    }

    let trend: Vec<TrendDataPoint> = trend_map.into_values().collect();

    // --- Overall stats ---
    let total_scans: i64 = conn.query_row(
        "SELECT COUNT(*) FROM scans WHERE project_id = ?1 AND status = 'completed'",
        params![project_id],
        |row| row.get(0),
    ).unwrap_or(0);

    let (avg_visibility, mention_rate) = conn.query_row(
        "SELECT
            COALESCE(AVG(pr.visibility_score), 0.0),
            COALESCE(AVG(CASE WHEN pr.brand_mentioned = 1 THEN 1.0 ELSE 0.0 END), 0.0)
         FROM parsed_results pr
         JOIN scans s ON pr.scan_id = s.id
         WHERE s.project_id = ?1",
        params![project_id],
        |row| Ok((row.get::<_, f64>(0)?, row.get::<_, f64>(1)?)),
    ).unwrap_or((0.0, 0.0));

    Ok(InsightsResponse {
        sources,
        trend,
        total_scans,
        avg_visibility,
        mention_rate,
    })
}
