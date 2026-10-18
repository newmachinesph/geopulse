use rusqlite::{params, Connection};
use crate::models::ActionItem;

fn row_to_action(row: &rusqlite::Row) -> rusqlite::Result<ActionItem> {
    Ok(ActionItem {
        id: row.get(0)?,
        project_id: row.get(1)?,
        scan_id: row.get(2)?,
        action_type: row.get(3)?,
        priority: row.get(4)?,
        status: row.get(5)?,
        title: row.get(6)?,
        description: row.get(7)?,
        impact_score: row.get(8)?,
        related_prompt_ids: row.get(9)?,
        related_engine: row.get(10)?,
        created_at: row.get(11)?,
        updated_at: row.get(12)?,
    })
}

const SELECT_COLS: &str = "id, project_id, scan_id, action_type, priority, status, title, description, impact_score, related_prompt_ids, related_engine, created_at, updated_at";

pub fn get_all_actions(conn: &Connection, project_id: &str) -> rusqlite::Result<Vec<ActionItem>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM action_items WHERE project_id = ?1 ORDER BY impact_score DESC, created_at DESC", SELECT_COLS
    ))?;
    let rows = stmt.query_map(params![project_id], |row| row_to_action(row))?;
    rows.collect()
}

pub fn get_action(conn: &Connection, id: &str) -> rusqlite::Result<Option<ActionItem>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM action_items WHERE id = ?1", SELECT_COLS
    ))?;
    let mut rows = stmt.query_map(params![id], |row| row_to_action(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn create_action(conn: &Connection, project_id: &str, title: &str, action_type: &str) -> rusqlite::Result<ActionItem> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO action_items (id, project_id, action_type, title, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, project_id, action_type, title, now, now],
    )?;
    Ok(ActionItem {
        id,
        project_id: project_id.to_string(),
        scan_id: None,
        action_type: action_type.to_string(),
        priority: "medium".to_string(),
        status: "open".to_string(),
        title: title.to_string(),
        description: String::new(),
        impact_score: 0,
        related_prompt_ids: "[]".to_string(),
        related_engine: None,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn update_action_status(conn: &Connection, id: &str, status: &str) -> rusqlite::Result<bool> {
    let now = chrono::Utc::now().to_rfc3339();
    let rows = conn.execute(
        "UPDATE action_items SET status = ?1, updated_at = ?2 WHERE id = ?3",
        params![status, now, id],
    )?;
    Ok(rows > 0)
}

pub fn delete_action(conn: &Connection, id: &str) -> rusqlite::Result<bool> {
    let rows = conn.execute("DELETE FROM action_items WHERE id = ?1", params![id])?;
    Ok(rows > 0)
}

pub fn get_actions(conn: &Connection, project_id: &str) -> rusqlite::Result<Vec<ActionItem>> {
    get_all_actions(conn, project_id)
}

pub fn update_action(conn: &Connection, id: &str, status: &str) -> rusqlite::Result<Option<ActionItem>> {
    let updated = update_action_status(conn, id, status)?;
    if !updated {
        return Ok(None);
    }
    get_action(conn, id)
}

pub fn dismiss_action(conn: &Connection, id: &str) -> rusqlite::Result<bool> {
    update_action_status(conn, id, "dismissed")
}

pub fn clear_actions(conn: &Connection, project_id: &str) -> rusqlite::Result<usize> {
    conn.execute("DELETE FROM action_items WHERE project_id = ?1", params![project_id])
}
