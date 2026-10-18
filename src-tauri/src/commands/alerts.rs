use tauri::State;
use crate::db::queries::alerts as alert_queries;
use crate::models::Alert;
use crate::AppState;

#[tauri::command]
pub fn get_alerts(state: State<AppState>, project_id: String) -> Result<Vec<Alert>, String> {
    state.db.with_conn(|conn| alert_queries::get_alerts(conn, &project_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_unread_alerts(state: State<AppState>, project_id: String) -> Result<Vec<Alert>, String> {
    state.db.with_conn(|conn| alert_queries::get_unread_alerts(conn, &project_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mark_alert_read(state: State<AppState>, id: String) -> Result<bool, String> {
    state.db.with_conn(|conn| alert_queries::mark_alert_read(conn, &id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mark_all_alerts_read(state: State<AppState>, project_id: String) -> Result<(), String> {
    state.db.with_conn(|conn| alert_queries::mark_all_read(conn, &project_id)).map_err(|e| e.to_string())
}
