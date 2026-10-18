use rusqlite::{params, Connection};
use crate::models::{RawResponse, ParsedResult, VisibilityScoreAggregate};

fn row_to_raw_response(row: &rusqlite::Row) -> rusqlite::Result<RawResponse> {
    Ok(RawResponse {
        id: row.get(0)?,
        scan_id: row.get(1)?,
        prompt_id: row.get(2)?,
        engine: row.get(3)?,
        market: row.get(4)?,
        raw_text: row.get(5)?,
        response_time_ms: row.get(6)?,
        error: row.get(7)?,
        created_at: row.get(8)?,
    })
}

fn row_to_parsed_result(row: &rusqlite::Row) -> rusqlite::Result<ParsedResult> {
    Ok(ParsedResult {
        id: row.get(0)?,
        raw_response_id: row.get(1)?,
        scan_id: row.get(2)?,
        prompt_id: row.get(3)?,
        engine: row.get(4)?,
        market: row.get(5)?,
        brand_mentioned: row.get::<_, i32>(6)? != 0,
        mention_position: row.get(7)?,
        total_entities_mentioned: row.get(8)?,
        sentiment_level: row.get(9)?,
        sentiment_score: row.get(10)?,
        visibility_score: row.get(11)?,
        brand_context: row.get(12)?,
        competitors_mentioned: row.get(13)?,
        created_at: row.get(14)?,
    })
}

const RAW_COLS: &str = "id, scan_id, prompt_id, engine, market, raw_text, response_time_ms, error, created_at";
const PARSED_COLS: &str = "id, raw_response_id, scan_id, prompt_id, engine, market, brand_mentioned, mention_position, total_entities_mentioned, sentiment_level, sentiment_score, visibility_score, brand_context, competitors_mentioned, created_at";

pub fn get_raw_responses(conn: &Connection, scan_id: &str) -> rusqlite::Result<Vec<RawResponse>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM raw_responses WHERE scan_id = ?1 ORDER BY created_at", RAW_COLS
    ))?;
    let rows = stmt.query_map(params![scan_id], |row| row_to_raw_response(row))?;
    rows.collect()
}

pub fn get_raw_response(conn: &Connection, id: &str) -> rusqlite::Result<Option<RawResponse>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM raw_responses WHERE id = ?1", RAW_COLS
    ))?;
    let mut rows = stmt.query_map(params![id], |row| row_to_raw_response(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn insert_raw_response(conn: &Connection, response: &RawResponse) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT INTO raw_responses (id, scan_id, prompt_id, engine, market, raw_text, response_time_ms, error, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![response.id, response.scan_id, response.prompt_id, response.engine, response.market, response.raw_text, response.response_time_ms, response.error, response.created_at],
    )?;
    Ok(())
}

pub fn get_parsed_results(conn: &Connection, scan_id: &str) -> rusqlite::Result<Vec<ParsedResult>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM parsed_results WHERE scan_id = ?1 ORDER BY created_at", PARSED_COLS
    ))?;
    let rows = stmt.query_map(params![scan_id], |row| row_to_parsed_result(row))?;
    rows.collect()
}

pub fn get_parsed_result(conn: &Connection, id: &str) -> rusqlite::Result<Option<ParsedResult>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM parsed_results WHERE id = ?1", PARSED_COLS
    ))?;
    let mut rows = stmt.query_map(params![id], |row| row_to_parsed_result(row))?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn insert_parsed_result(conn: &Connection, result: &ParsedResult) -> rusqlite::Result<()> {
    let brand_mentioned_int: i32 = if result.brand_mentioned { 1 } else { 0 };
    conn.execute(
        "INSERT INTO parsed_results (id, raw_response_id, scan_id, prompt_id, engine, market, brand_mentioned, mention_position, total_entities_mentioned, sentiment_level, sentiment_score, visibility_score, brand_context, competitors_mentioned, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
        params![result.id, result.raw_response_id, result.scan_id, result.prompt_id, result.engine, result.market, brand_mentioned_int, result.mention_position, result.total_entities_mentioned, result.sentiment_level, result.sentiment_score, result.visibility_score, result.brand_context, result.competitors_mentioned, result.created_at],
    )?;
    Ok(())
}

pub fn get_visibility_aggregates(conn: &Connection, project_id: &str) -> rusqlite::Result<Vec<VisibilityScoreAggregate>> {
    let mut stmt = conn.prepare(
        "SELECT
            s.project_id,
            pr.engine,
            pr.market,
            AVG(pr.visibility_score) as avg_score,
            AVG(CASE WHEN pr.brand_mentioned = 1 THEN 1.0 ELSE 0.0 END) as mention_rate,
            AVG(CASE WHEN pr.mention_position IS NOT NULL AND pr.mention_position <= 3 THEN 1.0 ELSE 0.0 END) as top_three_rate,
            AVG(CASE WHEN pr.sentiment_level = 'positive' THEN 1.0 ELSE 0.0 END) as positive_sentiment_rate,
            0.0 as citation_rate,
            CASE WHEN pr.total_entities_mentioned > 0
                THEN AVG(CASE WHEN pr.brand_mentioned = 1 THEN 1.0 ELSE 0.0 END)
                ELSE 0.0 END as share_of_voice,
            COUNT(*) as prompt_count,
            s.id as scan_id,
            s.created_at as calculated_at
         FROM parsed_results pr
         JOIN scans s ON pr.scan_id = s.id
         WHERE s.project_id = ?1
         GROUP BY s.project_id, pr.engine, pr.market, s.id
         ORDER BY s.created_at DESC"
    )?;
    let rows = stmt.query_map(params![project_id], |row| {
        Ok(VisibilityScoreAggregate {
            project_id: row.get(0)?,
            engine: row.get(1)?,
            market: row.get(2)?,
            avg_score: row.get(3)?,
            mention_rate: row.get(4)?,
            top_three_rate: row.get(5)?,
            positive_sentiment_rate: row.get(6)?,
            citation_rate: row.get(7)?,
            share_of_voice: row.get(8)?,
            prompt_count: row.get(9)?,
            scan_id: row.get(10)?,
            calculated_at: row.get(11)?,
        })
    })?;
    rows.collect()
}

pub fn get_scan_results(conn: &Connection, scan_id: &str) -> rusqlite::Result<Vec<ParsedResult>> {
    get_parsed_results(conn, scan_id)
}

pub fn get_prompt_results(conn: &Connection, prompt_id: &str) -> rusqlite::Result<Vec<ParsedResult>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM parsed_results WHERE prompt_id = ?1 ORDER BY created_at DESC", PARSED_COLS
    ))?;
    let rows = stmt.query_map(params![prompt_id], |row| row_to_parsed_result(row))?;
    rows.collect()
}

pub fn get_visibility_scores(conn: &Connection, project_id: &str) -> rusqlite::Result<Vec<VisibilityScoreAggregate>> {
    get_visibility_aggregates(conn, project_id)
}
