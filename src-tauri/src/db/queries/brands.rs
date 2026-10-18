use rusqlite::{params, Connection};
use crate::models::BrandProfile;

fn row_to_brand(row: &rusqlite::Row) -> rusqlite::Result<BrandProfile> {
    Ok(BrandProfile {
        id: row.get(0)?,
        project_id: row.get(1)?,
        entity_name: row.get(2)?,
        aliases: row.get(3)?,
        competitors: row.get(4)?,
        target_keywords: row.get(5)?,
        validated: row.get::<_, i32>(6)? != 0,
        validation_data: row.get(7)?,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
    })
}

const SELECT_COLS: &str = "id, project_id, entity_name, aliases, competitors, target_keywords, validated, validation_data, created_at, updated_at";

pub fn get_brand_profile(conn: &Connection, project_id: &str) -> rusqlite::Result<Option<BrandProfile>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM brand_profiles WHERE project_id = ?1", SELECT_COLS
    ))?;
    let mut rows = stmt.query_map(params![project_id], |row| row_to_brand(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn create_brand_profile(conn: &Connection, project_id: &str, entity_name: &str) -> rusqlite::Result<BrandProfile> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO brand_profiles (id, project_id, entity_name, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, project_id, entity_name, now, now],
    )?;
    Ok(BrandProfile {
        id,
        project_id: project_id.to_string(),
        entity_name: entity_name.to_string(),
        aliases: "[]".to_string(),
        competitors: "[]".to_string(),
        target_keywords: "[]".to_string(),
        validated: false,
        validation_data: None,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn update_brand_profile(conn: &Connection, id: &str, entity_name: &str) -> rusqlite::Result<Option<BrandProfile>> {
    let now = chrono::Utc::now().to_rfc3339();
    let rows = conn.execute(
        "UPDATE brand_profiles SET entity_name = ?1, updated_at = ?2 WHERE id = ?3",
        params![entity_name, now, id],
    )?;
    if rows == 0 {
        return Ok(None);
    }
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM brand_profiles WHERE id = ?1", SELECT_COLS
    ))?;
    let mut result = stmt.query_map(params![id], |row| row_to_brand(row))?;
    match result.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn delete_brand_profile(conn: &Connection, id: &str) -> rusqlite::Result<bool> {
    let rows = conn.execute("DELETE FROM brand_profiles WHERE id = ?1", params![id])?;
    Ok(rows > 0)
}

pub fn save_brand_profile(conn: &Connection, input: &BrandProfile) -> rusqlite::Result<BrandProfile> {
    let now = chrono::Utc::now().to_rfc3339();
    let validated_int: i32 = if input.validated { 1 } else { 0 };
    conn.execute(
        "INSERT INTO brand_profiles (id, project_id, entity_name, aliases, competitors, target_keywords, validated, validation_data, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
         ON CONFLICT(id) DO UPDATE SET
           entity_name = excluded.entity_name,
           aliases = excluded.aliases,
           competitors = excluded.competitors,
           target_keywords = excluded.target_keywords,
           validated = excluded.validated,
           validation_data = excluded.validation_data,
           updated_at = excluded.updated_at",
        params![input.id, input.project_id, input.entity_name, input.aliases, input.competitors, input.target_keywords, validated_int, input.validation_data, now, now],
    )?;
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM brand_profiles WHERE id = ?1", SELECT_COLS
    ))?;
    let mut rows = stmt.query_map(params![input.id], |row| row_to_brand(row))?;
    match rows.next() {
        Some(row) => Ok(row?),
        None => Ok(input.clone()),
    }
}
