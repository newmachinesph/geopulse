use rusqlite::{params, Connection};
use crate::models::Citation;

fn row_to_citation(row: &rusqlite::Row) -> rusqlite::Result<Citation> {
    Ok(Citation {
        id: row.get(0)?,
        parsed_result_id: row.get(1)?,
        url: row.get(2)?,
        domain: row.get(3)?,
        title: row.get(4)?,
        source_type: row.get(5)?,
        is_authoritative: row.get::<_, i32>(6)? != 0,
        position: row.get(7)?,
        created_at: row.get(8)?,
    })
}

const SELECT_COLS: &str = "id, parsed_result_id, url, domain, title, source_type, is_authoritative, position, created_at";

pub fn get_citations(conn: &Connection, parsed_result_id: &str) -> rusqlite::Result<Vec<Citation>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM citations WHERE parsed_result_id = ?1 ORDER BY position", SELECT_COLS
    ))?;
    let rows = stmt.query_map(params![parsed_result_id], |row| row_to_citation(row))?;
    rows.collect()
}

pub fn get_citation(conn: &Connection, id: &str) -> rusqlite::Result<Option<Citation>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM citations WHERE id = ?1", SELECT_COLS
    ))?;
    let mut rows = stmt.query_map(params![id], |row| row_to_citation(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn get_citations_by_scan(conn: &Connection, scan_id: &str) -> rusqlite::Result<Vec<Citation>> {
    let mut stmt = conn.prepare(
        "SELECT c.id, c.parsed_result_id, c.url, c.domain, c.title, c.source_type, c.is_authoritative, c.position, c.created_at
         FROM citations c
         JOIN parsed_results pr ON c.parsed_result_id = pr.id
         WHERE pr.scan_id = ?1
         ORDER BY c.position"
    )?;
    let rows = stmt.query_map(params![scan_id], |row| row_to_citation(row))?;
    rows.collect()
}

pub fn insert_citation(conn: &Connection, citation: &Citation) -> rusqlite::Result<()> {
    let authoritative_int: i32 = if citation.is_authoritative { 1 } else { 0 };
    conn.execute(
        "INSERT INTO citations (id, parsed_result_id, url, domain, title, source_type, is_authoritative, position, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![citation.id, citation.parsed_result_id, citation.url, citation.domain, citation.title, citation.source_type, authoritative_int, citation.position, citation.created_at],
    )?;
    Ok(())
}
