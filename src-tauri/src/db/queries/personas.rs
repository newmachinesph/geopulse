use rusqlite::{params, Connection};
use crate::models::Persona;

fn row_to_persona(row: &rusqlite::Row) -> rusqlite::Result<Persona> {
    Ok(Persona {
        id: row.get(0)?,
        project_id: row.get(1)?,
        name: row.get(2)?,
        description: row.get::<_, Option<String>>(3)?.unwrap_or_default(),
        demographics: row.get(4)?,
        search_behavior: row.get(5)?,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
    })
}

const SELECT_COLS: &str = "id, project_id, name, description, demographics, search_behavior, created_at, updated_at";

pub fn get_personas(conn: &Connection, project_id: &str) -> rusqlite::Result<Vec<Persona>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM personas WHERE project_id = ?1 ORDER BY created_at DESC", SELECT_COLS
    ))?;
    let rows = stmt.query_map(params![project_id], |row| row_to_persona(row))?;
    rows.collect()
}

pub fn get_persona(conn: &Connection, id: &str) -> rusqlite::Result<Option<Persona>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM personas WHERE id = ?1", SELECT_COLS
    ))?;
    let mut rows = stmt.query_map(params![id], |row| row_to_persona(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn create_persona(conn: &Connection, project_id: &str, name: &str, description: &str, demographics: &str, search_behavior: &str) -> rusqlite::Result<Persona> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO personas (id, project_id, name, description, demographics, search_behavior, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![id, project_id, name, description, demographics, search_behavior, now, now],
    )?;
    Ok(Persona {
        id,
        project_id: project_id.to_string(),
        name: name.to_string(),
        description: description.to_string(),
        demographics: demographics.to_string(),
        search_behavior: search_behavior.to_string(),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn update_persona(conn: &Connection, id: &str, name: Option<&str>, description: Option<&str>, demographics: Option<&str>, search_behavior: Option<&str>) -> rusqlite::Result<Option<Persona>> {
    let existing = get_persona(conn, id)?;
    let existing = match existing {
        Some(p) => p,
        None => return Ok(None),
    };

    let name = name.unwrap_or(&existing.name);
    let description = description.unwrap_or(&existing.description);
    let demographics = demographics.unwrap_or(&existing.demographics);
    let search_behavior = search_behavior.unwrap_or(&existing.search_behavior);
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE personas SET name = ?1, description = ?2, demographics = ?3, search_behavior = ?4, updated_at = ?5 WHERE id = ?6",
        params![name, description, demographics, search_behavior, now, id],
    )?;
    get_persona(conn, id)
}

pub fn delete_persona(conn: &Connection, id: &str) -> rusqlite::Result<bool> {
    let rows = conn.execute("DELETE FROM personas WHERE id = ?1", params![id])?;
    Ok(rows > 0)
}

pub fn clear_personas(conn: &Connection, project_id: &str) -> rusqlite::Result<usize> {
    conn.execute("DELETE FROM personas WHERE project_id = ?1", params![project_id])
}
