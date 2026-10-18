use tauri::State;
use crate::db::queries::settings as settings_queries;
use crate::models::GeoSettings;
use crate::AppState;

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> Result<String, String> {
    let db_settings = state.db.with_conn(|conn| settings_queries::get_settings(conn)).map_err(|e| e.to_string())?;
    let settings = db_settings.unwrap_or_default();
    serde_json::to_string(&settings).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_settings(state: State<AppState>, settings: String) -> Result<(), String> {
    let parsed: GeoSettings = serde_json::from_str(&settings).map_err(|e| e.to_string())?;
    state.db.with_conn(|conn| {
        settings_queries::update_settings(conn, &parsed).map(|_| ())
    }).map_err(|e| e.to_string())
}
