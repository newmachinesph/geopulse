use rusqlite::{params, Connection};
use crate::models::Scan;

fn row_to_scan(row: &rusqlite::Row) -> rusqlite::Result<Scan> {
    Ok(Scan {
        id: row.get(0)?,
        project_id: row.get(1)?,
        config: row.get(2)?,
        status: row.get(3)?,
        progress: row.get(4)?,
        total_prompts: row.get(5)?,
        completed_prompts: row.get(6)?,
        failed_prompts: row.get(7)?,
        started_at: row.get(8)?,
        completed_at: row.get(9)?,
        created_at: row.get(10)?,
    })
}

const SELECT_COLS: &str = "id, project_id, config, status, progress, total_prompts, completed_prompts, failed_prompts, started_at, completed_at, created_at";

pub fn get_all_scans(conn: &Connection, project_id: &str) -> rusqlite::Result<Vec<Scan>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM scans WHERE project_id = ?1 ORDER BY created_at DESC", SELECT_COLS
    ))?;
    let rows = stmt.query_map(params![project_id], |row| row_to_scan(row))?;
    rows.collect()
}

pub fn get_scan(conn: &Connection, id: &str) -> rusqlite::Result<Option<Scan>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM scans WHERE id = ?1", SELECT_COLS
    ))?;
    let mut rows = stmt.query_map(params![id], |row| row_to_scan(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn create_scan(conn: &Connection, project_id: &str, config: &str) -> rusqlite::Result<Scan> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO scans (id, project_id, config, status, progress, total_prompts, completed_prompts, failed_prompts, created_at)
         VALUES (?1, ?2, ?3, 'pending', 0, 0, 0, 0, ?4)",
        params![id, project_id, config, now],
    )?;
    Ok(Scan {
        id,
        project_id: project_id.to_string(),
        config: config.to_string(),
        status: "pending".to_string(),
        progress: 0,
        total_prompts: 0,
        completed_prompts: 0,
        failed_prompts: 0,
        started_at: None,
        completed_at: None,
        created_at: now,
    })
}

pub fn update_scan_status(conn: &Connection, id: &str, status: &str) -> rusqlite::Result<bool> {
    let rows = conn.execute(
        "UPDATE scans SET status = ?1 WHERE id = ?2",
        params![status, id],
    )?;
    Ok(rows > 0)
}

pub fn update_scan_progress(conn: &Connection, id: &str, completed: i64, failed: i64, total: i64) -> rusqlite::Result<bool> {
    let progress = if total > 0 { ((completed + failed) * 100) / total } else { 0 };
    let rows = conn.execute(
        "UPDATE scans SET completed_prompts = ?1, failed_prompts = ?2, total_prompts = ?3, progress = ?4 WHERE id = ?5",
        params![completed, failed, total, progress, id],
    )?;
    Ok(rows > 0)
}

pub fn delete_scan(conn: &Connection, id: &str) -> rusqlite::Result<bool> {
    let rows = conn.execute("DELETE FROM scans WHERE id = ?1", params![id])?;
    Ok(rows > 0)
}

pub fn get_scans(conn: &Connection, project_id: &str) -> rusqlite::Result<Vec<Scan>> {
    get_all_scans(conn, project_id)
}

pub fn cancel_scan(conn: &Connection, id: &str) -> rusqlite::Result<bool> {
    update_scan_status(conn, id, "cancelled")
}

pub fn clear_scans(conn: &Connection, project_id: &str) -> rusqlite::Result<usize> {
    // Cascade delete: citations -> parsed_results -> raw_responses -> action_items -> scans
    conn.execute(
        "DELETE FROM citations WHERE parsed_result_id IN (SELECT id FROM parsed_results WHERE scan_id IN (SELECT id FROM scans WHERE project_id = ?1))",
        params![project_id],
    )?;
    conn.execute(
        "DELETE FROM parsed_results WHERE scan_id IN (SELECT id FROM scans WHERE project_id = ?1)",
        params![project_id],
    )?;
    conn.execute(
        "DELETE FROM raw_responses WHERE scan_id IN (SELECT id FROM scans WHERE project_id = ?1)",
        params![project_id],
    )?;
    conn.execute(
        "DELETE FROM action_items WHERE scan_id IN (SELECT id FROM scans WHERE project_id = ?1)",
        params![project_id],
    )?;
    conn.execute("DELETE FROM scans WHERE project_id = ?1", params![project_id])
}
