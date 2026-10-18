use rusqlite::{params, Connection};
use crate::models::{Prompt, CreatePromptInput, UpdatePromptInput};

fn row_to_prompt(row: &rusqlite::Row) -> rusqlite::Result<Prompt> {
    Ok(Prompt {
        id: row.get(0)?,
        project_id: row.get(1)?,
        persona_id: row.get(2)?,
        text: row.get(3)?,
        intent_category: row.get(4)?,
        status: row.get(5)?,
        tags: row.get(6)?,
        last_run_at: row.get(7)?,
        run_count: row.get(8)?,
        avg_score: row.get(9)?,
        created_at: row.get(10)?,
        updated_at: row.get(11)?,
    })
}

const SELECT_COLS: &str = "id, project_id, persona_id, text, intent_category, status, tags, last_run_at, run_count, avg_score, created_at, updated_at";

pub fn get_all_prompts(conn: &Connection, project_id: &str) -> rusqlite::Result<Vec<Prompt>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM prompts WHERE project_id = ?1 ORDER BY created_at DESC", SELECT_COLS
    ))?;
    let rows = stmt.query_map(params![project_id], |row| row_to_prompt(row))?;
    rows.collect()
}

pub fn get_prompt(conn: &Connection, id: &str) -> rusqlite::Result<Option<Prompt>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM prompts WHERE id = ?1", SELECT_COLS
    ))?;
    let mut rows = stmt.query_map(params![id], |row| row_to_prompt(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn create_prompt(conn: &Connection, input: &CreatePromptInput) -> rusqlite::Result<Prompt> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let tags = input.tags.as_deref().unwrap_or("[]");
    conn.execute(
        "INSERT INTO prompts (id, project_id, text, intent_category, status, tags, run_count, avg_score, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, 'active', ?5, 0, 0.0, ?6, ?7)",
        params![id, input.project_id, input.text, input.intent_category, tags, now, now],
    )?;
    Ok(Prompt {
        id,
        project_id: input.project_id.clone(),
        persona_id: None,
        text: input.text.clone(),
        intent_category: input.intent_category.clone(),
        status: "active".to_string(),
        tags: tags.to_string(),
        last_run_at: None,
        run_count: 0,
        avg_score: 0.0,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn update_prompt(conn: &Connection, id: &str, input: &UpdatePromptInput) -> rusqlite::Result<Option<Prompt>> {
    let existing = get_prompt(conn, id)?;
    if existing.is_none() {
        return Ok(None);
    }
    let existing = existing.unwrap();
    let now = chrono::Utc::now().to_rfc3339();

    let text = input.text.as_deref().unwrap_or(&existing.text);
    let intent_category = input.intent_category.as_deref().unwrap_or(&existing.intent_category);
    let status = input.status.as_deref().unwrap_or(&existing.status);
    let tags = input.tags.as_deref().unwrap_or(&existing.tags);

    conn.execute(
        "UPDATE prompts SET text = ?1, intent_category = ?2, status = ?3, tags = ?4, updated_at = ?5 WHERE id = ?6",
        params![text, intent_category, status, tags, now, id],
    )?;
    get_prompt(conn, id)
}

pub fn delete_prompt(conn: &Connection, id: &str) -> rusqlite::Result<bool> {
    let rows = conn.execute("DELETE FROM prompts WHERE id = ?1", params![id])?;
    Ok(rows > 0)
}

pub fn get_prompts(conn: &Connection, project_id: &str) -> rusqlite::Result<Vec<Prompt>> {
    get_all_prompts(conn, project_id)
}

pub fn clear_prompts(conn: &Connection, project_id: &str) -> rusqlite::Result<usize> {
    conn.execute("DELETE FROM prompts WHERE project_id = ?1", params![project_id])
}

/// Update prompt stats (run_count, avg_score, last_run_at) from parsed_results after a scan.
pub fn update_prompt_stats_from_scan(conn: &Connection, scan_id: &str) -> rusqlite::Result<()> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE prompts SET
            run_count = run_count + (
                SELECT COUNT(*) FROM parsed_results pr WHERE pr.prompt_id = prompts.id AND pr.scan_id = ?1
            ),
            avg_score = COALESCE((
                SELECT AVG(pr2.visibility_score) FROM parsed_results pr2 WHERE pr2.prompt_id = prompts.id
            ), 0.0),
            last_run_at = ?2,
            updated_at = ?2
         WHERE id IN (SELECT DISTINCT prompt_id FROM parsed_results WHERE scan_id = ?1)",
        params![scan_id, now],
    )?;
    Ok(())
}
