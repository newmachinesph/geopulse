use tauri::State;
use crate::db::queries::citations as citation_queries;
use crate::models::Citation;
use crate::AppState;

#[tauri::command]
pub fn get_citations(state: State<AppState>, parsed_result_id: String) -> Result<Vec<Citation>, String> {
    state.db.with_conn(|conn| citation_queries::get_citations(conn, &parsed_result_id)).map_err(|e| e.to_string())
}
