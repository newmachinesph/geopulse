use tauri::State;
use crate::db::queries::results as result_queries;
use crate::models::{ParsedResult, RawResponse, VisibilityScoreAggregate};
use crate::AppState;

#[tauri::command]
pub fn get_scan_results(state: State<AppState>, scan_id: String) -> Result<Vec<ParsedResult>, String> {
    state.db.with_conn(|conn| result_queries::get_scan_results(conn, &scan_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_raw_response(state: State<AppState>, id: String) -> Result<Option<RawResponse>, String> {
    state.db.with_conn(|conn| result_queries::get_raw_response(conn, &id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_visibility_scores(state: State<AppState>, project_id: String) -> Result<Vec<VisibilityScoreAggregate>, String> {
    state.db.with_conn(|conn| result_queries::get_visibility_scores(conn, &project_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_prompt_results(state: State<AppState>, prompt_id: String) -> Result<Vec<ParsedResult>, String> {
    state.db.with_conn(|conn| result_queries::get_prompt_results(conn, &prompt_id)).map_err(|e| e.to_string())
}
