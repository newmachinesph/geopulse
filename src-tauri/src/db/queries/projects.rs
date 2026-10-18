use rusqlite::{params, Connection};
use crate::models::{Project, CreateProjectInput, UpdateProjectInput};

fn row_to_project(row: &rusqlite::Row) -> rusqlite::Result<Project> {
    Ok(Project {
        id: row.get(0)?,
        name: row.get(1)?,
        site_url: row.get(2)?,
        brand_name: row.get(3)?,
        industry: row.get(4)?,
        market: row.get(5)?,
        language: row.get(6)?,
        description: row.get(7)?,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
    })
}

const SELECT_COLS: &str = "id, name, site_url, brand_name, industry, market, language, description, created_at, updated_at";

pub fn get_all_projects(conn: &Connection) -> rusqlite::Result<Vec<Project>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM projects ORDER BY updated_at DESC", SELECT_COLS
    ))?;
    let rows = stmt.query_map([], |row| row_to_project(row))?;
    rows.collect()
}

pub fn get_project(conn: &Connection, id: &str) -> rusqlite::Result<Option<Project>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM projects WHERE id = ?1", SELECT_COLS
    ))?;
    let mut rows = stmt.query_map(params![id], |row| row_to_project(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn create_project(conn: &Connection, input: &CreateProjectInput) -> rusqlite::Result<Project> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO projects (id, name, site_url, brand_name, industry, market, language, description, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![id, input.name, input.site_url, input.brand_name, input.industry, input.market, input.language, input.description, now, now],
    )?;
    Ok(Project {
        id,
        name: input.name.clone(),
        site_url: input.site_url.clone(),
        brand_name: input.brand_name.clone(),
        industry: input.industry.clone(),
        market: input.market.clone(),
        language: input.language.clone(),
        description: input.description.clone(),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn update_project(conn: &Connection, id: &str, input: &UpdateProjectInput) -> rusqlite::Result<Option<Project>> {
    let existing = get_project(conn, id)?;
    if existing.is_none() {
        return Ok(None);
    }
    let existing = existing.unwrap();
    let now = chrono::Utc::now().to_rfc3339();

    let name = input.name.as_deref().unwrap_or(&existing.name);
    let site_url = input.site_url.as_deref().unwrap_or(&existing.site_url);
    let brand_name = input.brand_name.as_deref().unwrap_or(&existing.brand_name);
    let industry = input.industry.as_deref().unwrap_or(&existing.industry);
    let market = input.market.as_deref().unwrap_or(&existing.market);
    let language = input.language.as_deref().unwrap_or(&existing.language);
    let description = input.description.as_ref().or(existing.description.as_ref());

    conn.execute(
        "UPDATE projects SET name = ?1, site_url = ?2, brand_name = ?3, industry = ?4, market = ?5, language = ?6, description = ?7, updated_at = ?8
         WHERE id = ?9",
        params![name, site_url, brand_name, industry, market, language, description, now, id],
    )?;
    get_project(conn, id)
}

pub fn delete_project(conn: &Connection, id: &str) -> rusqlite::Result<bool> {
    let rows = conn.execute("DELETE FROM projects WHERE id = ?1", params![id])?;
    Ok(rows > 0)
}

pub fn reset_all_data(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "DELETE FROM citations;
         DELETE FROM parsed_results;
         DELETE FROM raw_responses;
         DELETE FROM action_items;
         DELETE FROM alerts;
         DELETE FROM scans;
         DELETE FROM prompts;
         DELETE FROM personas;
         DELETE FROM brand_profiles;
         DELETE FROM projects;
         DELETE FROM settings;"
    )
}
