use rusqlite::{params, Connection};
use crate::models::Alert;

fn row_to_alert(row: &rusqlite::Row) -> rusqlite::Result<Alert> {
    Ok(Alert {
        id: row.get(0)?,
        project_id: row.get(1)?,
        scan_id: row.get(2)?,
        alert_type: row.get(3)?,
        severity: row.get(4)?,
        title: row.get(5)?,
        message: row.get(6)?,
        is_read: row.get::<_, i32>(7)? != 0,
        created_at: row.get(8)?,
    })
}

const COLS: &str = "id, project_id, scan_id, alert_type, severity, title, message, is_read, created_at";

pub fn get_alerts(conn: &Connection, project_id: &str) -> rusqlite::Result<Vec<Alert>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM alerts WHERE project_id = ?1 ORDER BY created_at DESC", COLS
    ))?;
    let rows = stmt.query_map(params![project_id], |row| row_to_alert(row))?;
    rows.collect()
}

pub fn get_unread_alerts(conn: &Connection, project_id: &str) -> rusqlite::Result<Vec<Alert>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM alerts WHERE project_id = ?1 AND is_read = 0 ORDER BY created_at DESC", COLS
    ))?;
    let rows = stmt.query_map(params![project_id], |row| row_to_alert(row))?;
    rows.collect()
}

pub fn create_alert(
    conn: &Connection,
    project_id: &str,
    scan_id: Option<&str>,
    alert_type: &str,
    severity: &str,
    title: &str,
    message: &str,
) -> rusqlite::Result<Alert> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO alerts (id, project_id, scan_id, alert_type, severity, title, message, is_read, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0, ?8)",
        params![id, project_id, scan_id, alert_type, severity, title, message, now],
    )?;
    Ok(Alert {
        id,
        project_id: project_id.to_string(),
        scan_id: scan_id.map(String::from),
        alert_type: alert_type.to_string(),
        severity: severity.to_string(),
        title: title.to_string(),
        message: message.to_string(),
        is_read: false,
        created_at: now,
    })
}

pub fn mark_alert_read(conn: &Connection, id: &str) -> rusqlite::Result<bool> {
    let count = conn.execute(
        "UPDATE alerts SET is_read = 1 WHERE id = ?1",
        params![id],
    )?;
    Ok(count > 0)
}

pub fn mark_all_read(conn: &Connection, project_id: &str) -> rusqlite::Result<()> {
    conn.execute(
        "UPDATE alerts SET is_read = 1 WHERE project_id = ?1 AND is_read = 0",
        params![project_id],
    )?;
    Ok(())
}
