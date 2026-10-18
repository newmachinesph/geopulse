use tauri::State;
use crate::db::queries::insights as insight_queries;
use crate::AppState;

#[tauri::command]
pub fn get_insights(state: State<AppState>, project_id: String) -> Result<String, String> {
    let insights = state.db.with_conn(|conn| insight_queries::get_insights(conn, &project_id))
        .map_err(|e| e.to_string())?;
    serde_json::to_string(&insights).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_gap_analysis(state: State<AppState>, project_id: String) -> Result<String, String> {
    let gaps = state.db.with_conn(|conn| insight_queries::get_gap_analysis(conn, &project_id))
        .map_err(|e| e.to_string())?;
    serde_json::to_string(&gaps).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_competitor_comparison(state: State<AppState>, project_id: String) -> Result<String, String> {
    let comparison = state.db.with_conn(|conn| insight_queries::get_competitor_comparison(conn, &project_id))
        .map_err(|e| e.to_string())?;
    serde_json::to_string(&comparison).map_err(|e| e.to_string())
}
