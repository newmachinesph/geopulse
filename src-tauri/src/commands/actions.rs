use tauri::State;
use crate::db::queries::actions as action_queries;
use crate::models::ActionItem;
use crate::AppState;

#[tauri::command]
pub fn get_actions(state: State<AppState>, project_id: String) -> Result<Vec<ActionItem>, String> {
    state.db.with_conn(|conn| action_queries::get_actions(conn, &project_id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_action(state: State<AppState>, id: String, status: String) -> Result<Option<ActionItem>, String> {
    state.db.with_conn(|conn| action_queries::update_action(conn, &id, &status)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn dismiss_action(state: State<AppState>, id: String) -> Result<bool, String> {
    state.db.with_conn(|conn| action_queries::dismiss_action(conn, &id)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_actions(state: State<AppState>, project_id: String) -> Result<usize, String> {
    state.db.with_conn(|conn| action_queries::clear_actions(conn, &project_id)).map_err(|e| e.to_string())
}
