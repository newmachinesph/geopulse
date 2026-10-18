pub mod api;
mod commands;
mod db;
mod models;
pub mod pipeline;

use db::Database;
use std::sync::Arc;

pub struct AppState {
    pub db: Arc<Database>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load .env file if present (non-fatal if missing)
    let _ = dotenvy::dotenv();

    let db = Database::new().expect("Failed to initialize database");
    let state = AppState { db: Arc::new(db) };

    // Start background scheduler for auto-scanning
    pipeline::scheduler::start_scheduler(state.db.clone());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            // Projects
            commands::get_all_projects,
            commands::get_project,
            commands::create_project,
            commands::update_project,
            commands::delete_project,
            commands::autofill_project,
            commands::reset_application,
            // Brand Profiles
            commands::get_brand_profile,
            commands::save_brand_profile,
            commands::validate_brand_entity,
            commands::autofill_brand_profile,
            // Personas
            commands::get_personas,
            commands::get_persona,
            commands::create_persona,
            commands::update_persona,
            commands::delete_persona,
            commands::clear_personas,
            commands::generate_personas,
            // Prompts
            commands::get_prompts,
            commands::get_prompt,
            commands::create_prompt,
            commands::update_prompt,
            commands::delete_prompt,
            commands::clear_prompts,
            commands::generate_prompts,
            // Scans
            commands::get_scans,
            commands::get_scan,
            commands::start_scan,
            commands::cancel_scan,
            commands::pause_scan,
            commands::resume_scan,
            commands::delete_scan,
            commands::clear_scans,
            commands::compare_scans,
            // Results
            commands::get_scan_results,
            commands::get_raw_response,
            commands::get_visibility_scores,
            commands::get_prompt_results,
            // Citations
            commands::get_citations,
            // Insights
            commands::get_insights,
            commands::get_gap_analysis,
            commands::get_competitor_comparison,
            // Actions
            commands::get_actions,
            commands::update_action,
            commands::dismiss_action,
            commands::clear_actions,
            // Alerts
            commands::get_alerts,
            commands::get_unread_alerts,
            commands::mark_alert_read,
            commands::mark_all_alerts_read,
            // Settings
            commands::get_settings,
            commands::update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
