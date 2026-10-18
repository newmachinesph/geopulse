use tauri::State;
use crate::db::queries::{scans as scan_queries, results as result_queries};
use crate::models::{Scan, ScanConfig, ScanComparison, ScanComparisonResult};
use crate::AppState;

#[tauri::command]
pub fn get_scans(state: State<AppState>, project_id: String) -> Result<Vec<Scan>, String> {
    state.db.with_conn(|conn| scan_queries::get_scans(conn, &project_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_scan(state: State<AppState>, id: String) -> Result<Option<Scan>, String> {
    state.db.with_conn(|conn| scan_queries::get_scan(conn, &id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn start_scan(state: State<AppState>, project_id: String, config: String) -> Result<Scan, String> {
    // Parse config
    let scan_config: ScanConfig = serde_json::from_str(&config)
        .map_err(|e| format!("Invalid scan config: {}", e))?;

    // Create scan record in DB
    let scan = state.db.with_conn(|conn| scan_queries::create_scan(conn, &project_id, &config))
        .map_err(|e| e.to_string())?;

    // Spawn async pipeline execution
    let db = (*state.db).clone();
    let scan_id = scan.id.clone();
    let project_id = project_id.clone();
    tauri::async_runtime::spawn(async move {
        crate::pipeline::run_scan(db, scan_id, project_id, scan_config).await;
    });

    Ok(scan)
}

#[tauri::command]
pub fn cancel_scan(state: State<AppState>, id: String) -> Result<bool, String> {
    state.db.with_conn(|conn| scan_queries::cancel_scan(conn, &id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn pause_scan(state: State<AppState>, id: String) -> Result<bool, String> {
    state.db.with_conn(|conn| scan_queries::update_scan_status(conn, &id, "paused")).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn resume_scan(state: State<AppState>, id: String) -> Result<bool, String> {
    state.db.with_conn(|conn| scan_queries::update_scan_status(conn, &id, "running")).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_scan(state: State<AppState>, id: String) -> Result<bool, String> {
    // Also delete associated results and raw responses
    let _ = state.db.with_conn(|conn| {
        conn.execute("DELETE FROM citations WHERE parsed_result_id IN (SELECT id FROM parsed_results WHERE scan_id = ?1)", rusqlite::params![id])
    });
    let _ = state.db.with_conn(|conn| {
        conn.execute("DELETE FROM parsed_results WHERE scan_id = ?1", rusqlite::params![id])
    });
    let _ = state.db.with_conn(|conn| {
        conn.execute("DELETE FROM raw_responses WHERE scan_id = ?1", rusqlite::params![id])
    });
    state.db.with_conn(|conn| scan_queries::delete_scan(conn, &id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_scans(state: State<AppState>, project_id: String) -> Result<usize, String> {
    state.db.with_conn(|conn| scan_queries::clear_scans(conn, &project_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn compare_scans(state: State<AppState>, before_scan_id: String, after_scan_id: String) -> Result<ScanComparison, String> {
    let before_results = state.db.with_conn(|conn| result_queries::get_parsed_results(conn, &before_scan_id))
        .map_err(|e| e.to_string())?;
    let after_results = state.db.with_conn(|conn| result_queries::get_parsed_results(conn, &after_scan_id))
        .map_err(|e| e.to_string())?;

    // Build lookup: (prompt_id, engine, market) -> ParsedResult for before scan
    let mut before_map = std::collections::HashMap::new();
    for r in &before_results {
        before_map.insert((r.prompt_id.clone(), r.engine.clone(), r.market.clone()), r);
    }

    let mut comparison_results = Vec::new();

    for after in &after_results {
        let key = (after.prompt_id.clone(), after.engine.clone(), after.market.clone());
        if let Some(before) = before_map.get(&key) {
            comparison_results.push(ScanComparisonResult {
                prompt_id: after.prompt_id.clone(),
                engine: after.engine.clone(),
                market: after.market.clone(),
                before_score: before.visibility_score,
                after_score: after.visibility_score,
                score_delta: after.visibility_score - before.visibility_score,
                before_mentioned: before.brand_mentioned,
                after_mentioned: after.brand_mentioned,
                before_sentiment: before.sentiment_level.clone(),
                after_sentiment: after.sentiment_level.clone(),
            });
        }
    }

    let avg_before = if before_results.is_empty() { 0.0 } else {
        before_results.iter().map(|r| r.visibility_score).sum::<f64>() / before_results.len() as f64
    };
    let avg_after = if after_results.is_empty() { 0.0 } else {
        after_results.iter().map(|r| r.visibility_score).sum::<f64>() / after_results.len() as f64
    };
    let mention_before = if before_results.is_empty() { 0.0 } else {
        before_results.iter().filter(|r| r.brand_mentioned).count() as f64 / before_results.len() as f64
    };
    let mention_after = if after_results.is_empty() { 0.0 } else {
        after_results.iter().filter(|r| r.brand_mentioned).count() as f64 / after_results.len() as f64
    };

    Ok(ScanComparison {
        before_scan_id,
        after_scan_id,
        avg_score_before: avg_before,
        avg_score_after: avg_after,
        avg_score_delta: avg_after - avg_before,
        mention_rate_before: mention_before,
        mention_rate_after: mention_after,
        results: comparison_results,
    })
}
