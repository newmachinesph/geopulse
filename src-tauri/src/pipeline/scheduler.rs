use crate::db::Database;
use crate::db::queries::{projects as project_queries, scans as scan_queries, settings as settings_queries};
use crate::models::ScanConfig;
use std::sync::Arc;

/// Spawn a background task that periodically checks if scheduled scans should run.
/// Checks every 60 seconds. When auto_schedule is enabled, it triggers scans
/// for all projects that haven't been scanned within the schedule interval.
pub fn start_scheduler(db: Arc<Database>) {
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;

            if let Err(e) = check_and_run_scheduled_scans(&db).await {
                eprintln!("Scheduler error: {}", e);
            }
        }
    });
}

async fn check_and_run_scheduled_scans(db: &Database) -> Result<(), String> {
    // Load settings
    let settings = db.with_conn(|conn| settings_queries::get_settings(conn))
        .map_err(|e| e.to_string())?
        .unwrap_or_default();

    if !settings.scan.auto_schedule {
        return Ok(());
    }

    let interval_hours = settings.scan.schedule_interval_hours;
    if interval_hours <= 0 {
        return Ok(());
    }

    // Get all projects
    let projects = db.with_conn(|conn| project_queries::get_all_projects(conn))
        .map_err(|e| e.to_string())?;

    for project in &projects {
        // Check the most recent scan for this project
        let scans = db.with_conn(|conn| scan_queries::get_scans(conn, &project.id))
            .map_err(|e| e.to_string())?;

        let should_scan = if let Some(latest) = scans.first() {
            // Skip if there's already a running/pending scan
            if latest.status == "running" || latest.status == "pending" {
                false
            } else if let Ok(last_time) = chrono::DateTime::parse_from_rfc3339(&latest.created_at) {
                let now = chrono::Utc::now();
                let elapsed = now.signed_duration_since(last_time);
                elapsed.num_hours() >= interval_hours
            } else {
                true
            }
        } else {
            // No scans yet — trigger first scan
            true
        };

        if should_scan {
            let config = ScanConfig {
                engines: settings.scan.default_engines.clone(),
                markets: settings.scan.default_markets.clone(),
                languages: vec![],
                geo_simulation: false,
                prompt_ids: vec![],
            };

            let config_json = serde_json::to_string(&config).unwrap_or_default();

            // Create scan record
            let scan = db.with_conn(|conn| scan_queries::create_scan(conn, &project.id, &config_json))
                .map_err(|e| e.to_string())?;

            // Spawn pipeline
            let db_clone = (*db).clone();
            let scan_id = scan.id.clone();
            let project_id = project.id.clone();
            tauri::async_runtime::spawn(async move {
                crate::pipeline::run_scan(db_clone, scan_id, project_id, config).await;
            });

            eprintln!("Scheduled scan started for project: {}", project.name);
        }
    }

    Ok(())
}
