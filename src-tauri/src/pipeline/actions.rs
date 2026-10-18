use rusqlite::{params, Connection};
use std::collections::HashMap;

/// Represents a generated action item before DB insertion
struct GeneratedAction {
    action_type: String,
    priority: String,
    title: String,
    description: String,
    impact_score: i64,
    related_prompt_ids: Vec<String>,
    related_engine: Option<String>,
}

/// Analyze scan results and auto-generate action items.
/// Called after scan pipeline completes successfully.
pub fn generate_actions(conn: &Connection, project_id: &str, scan_id: &str) -> rusqlite::Result<usize> {
    let mut actions: Vec<GeneratedAction> = Vec::new();

    // 1. Content gap actions: prompts where brand NOT mentioned but competitors ARE
    actions.extend(find_content_gaps(conn, scan_id)?);

    // 2. Low visibility actions: prompts where visibility_score is low (<=1)
    actions.extend(find_low_visibility(conn, scan_id)?);

    // 3. Negative sentiment actions: prompts with negative sentiment
    actions.extend(find_negative_sentiment(conn, scan_id)?);

    // 4. Missing citation actions: no authoritative citations found
    actions.extend(find_missing_citations(conn, scan_id)?);

    // 5. Competitor dominance: competitors mentioned far more than brand
    actions.extend(find_competitor_dominance(conn, scan_id)?);

    // Insert all generated actions
    let count = actions.len();
    let now = chrono::Utc::now().to_rfc3339();

    for action in actions {
        let id = uuid::Uuid::new_v4().to_string();
        let prompt_ids_json = serde_json::to_string(&action.related_prompt_ids).unwrap_or_else(|_| "[]".to_string());
        conn.execute(
            "INSERT INTO action_items (id, project_id, scan_id, action_type, priority, status, title, description, impact_score, related_prompt_ids, related_engine, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, 'open', ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![id, project_id, scan_id, action.action_type, action.priority, action.title, action.description, action.impact_score, prompt_ids_json, action.related_engine, now, now],
        )?;
    }

    Ok(count)
}

/// Find prompts where brand is absent but competitors are present
fn find_content_gaps(conn: &Connection, scan_id: &str) -> rusqlite::Result<Vec<GeneratedAction>> {
    let mut stmt = conn.prepare(
        "SELECT pr.prompt_id, p.text, pr.engine, pr.competitors_mentioned
         FROM parsed_results pr
         JOIN prompts p ON pr.prompt_id = p.id
         WHERE pr.scan_id = ?1
           AND pr.brand_mentioned = 0
           AND pr.competitors_mentioned != '[]'
           AND pr.competitors_mentioned != ''
         ORDER BY p.text"
    )?;

    let rows = stmt.query_map(params![scan_id], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
        ))
    })?;

    // Group by prompt to avoid duplicate actions per engine
    let mut prompt_gaps: HashMap<String, (String, String, Vec<String>, Vec<String>)> = HashMap::new();
    for row in rows {
        let (prompt_id, prompt_text, engine, competitors_json) = row?;
        let competitors: Vec<String> = serde_json::from_str(&competitors_json).unwrap_or_default();
        let entry = prompt_gaps.entry(prompt_id.clone()).or_insert_with(|| {
            (prompt_id, prompt_text, Vec::new(), Vec::new())
        });
        if !entry.2.contains(&engine) {
            entry.2.push(engine);
        }
        for comp in competitors {
            if !entry.3.contains(&comp) {
                entry.3.push(comp);
            }
        }
    }

    let mut actions = Vec::new();
    for (_key, (prompt_id, prompt_text, engines, competitors)) in prompt_gaps {
        let truncated = truncate_text(&prompt_text, 60);
        let engine_list = engines.join(", ");
        let comp_list = competitors.join(", ");
        actions.push(GeneratedAction {
            action_type: "content_gap".to_string(),
            priority: "high".to_string(),
            title: format!("Content gap: \"{}\"", truncated),
            description: format!(
                "Your brand is not mentioned for this prompt, but competitors ({}) are. Engines affected: {}. Consider creating content that addresses this topic.",
                comp_list, engine_list
            ),
            impact_score: 8,
            related_prompt_ids: vec![prompt_id],
            related_engine: if engines.len() == 1 { Some(engines[0].clone()) } else { None },
        });
    }
    Ok(actions)
}

/// Find prompts with low visibility scores (<=1.0)
fn find_low_visibility(conn: &Connection, scan_id: &str) -> rusqlite::Result<Vec<GeneratedAction>> {
    let mut stmt = conn.prepare(
        "SELECT pr.prompt_id, p.text, pr.engine, pr.visibility_score
         FROM parsed_results pr
         JOIN prompts p ON pr.prompt_id = p.id
         WHERE pr.scan_id = ?1
           AND pr.brand_mentioned = 1
           AND pr.visibility_score <= 1.0
         ORDER BY pr.visibility_score ASC"
    )?;

    let rows = stmt.query_map(params![scan_id], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, f64>(3)?,
        ))
    })?;

    let mut actions = Vec::new();
    for row in rows {
        let (prompt_id, prompt_text, engine, score) = row?;
        let truncated = truncate_text(&prompt_text, 60);
        let (priority, impact) = if score <= 0.5 { ("critical", 9) } else { ("high", 6) };
        actions.push(GeneratedAction {
            action_type: "entity_optimization".to_string(),
            priority: priority.to_string(),
            title: format!("Low visibility ({:.1}/5): \"{}\"", score, truncated),
            description: format!(
                "Your brand is mentioned but has a low visibility score on {}. Improve content authority, get cited by authoritative sources, and ensure positive sentiment.",
                engine
            ),
            impact_score: impact,
            related_prompt_ids: vec![prompt_id],
            related_engine: Some(engine),
        });
    }
    Ok(actions)
}

/// Find prompts with negative sentiment
fn find_negative_sentiment(conn: &Connection, scan_id: &str) -> rusqlite::Result<Vec<GeneratedAction>> {
    let mut stmt = conn.prepare(
        "SELECT pr.prompt_id, p.text, pr.engine
         FROM parsed_results pr
         JOIN prompts p ON pr.prompt_id = p.id
         WHERE pr.scan_id = ?1
           AND pr.brand_mentioned = 1
           AND pr.sentiment_level = 'negative'
         ORDER BY p.text"
    )?;

    let rows = stmt.query_map(params![scan_id], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
        ))
    })?;

    let mut actions = Vec::new();
    for row in rows {
        let (prompt_id, prompt_text, engine) = row?;
        let truncated = truncate_text(&prompt_text, 60);
        actions.push(GeneratedAction {
            action_type: "sentiment_repair".to_string(),
            priority: "high".to_string(),
            title: format!("Negative sentiment: \"{}\"", truncated),
            description: format!(
                "Your brand is mentioned with negative sentiment on {}. Review the AI response and address any negative perceptions through improved content, PR, or reviews.",
                engine
            ),
            impact_score: 9,
            related_prompt_ids: vec![prompt_id],
            related_engine: Some(engine),
        });
    }
    Ok(actions)
}

/// Find results with no authoritative citations
fn find_missing_citations(conn: &Connection, scan_id: &str) -> rusqlite::Result<Vec<GeneratedAction>> {
    // Find parsed results that have brand mentioned but no authoritative citations
    let mut stmt = conn.prepare(
        "SELECT pr.prompt_id, p.text, pr.engine
         FROM parsed_results pr
         JOIN prompts p ON pr.prompt_id = p.id
         WHERE pr.scan_id = ?1
           AND pr.brand_mentioned = 1
           AND pr.id NOT IN (
               SELECT c.parsed_result_id FROM citations c
               WHERE c.is_authoritative = 1 OR c.source_type = 'owned'
           )
         ORDER BY p.text"
    )?;

    let rows = stmt.query_map(params![scan_id], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
        ))
    })?;

    // Group by prompt to avoid duplicate actions
    let mut prompt_engines: HashMap<String, (String, String, Vec<String>)> = HashMap::new();
    for row in rows {
        let (prompt_id, prompt_text, engine) = row?;
        let entry = prompt_engines.entry(prompt_id.clone()).or_insert_with(|| {
            (prompt_id, prompt_text, Vec::new())
        });
        if !entry.2.contains(&engine) {
            entry.2.push(engine);
        }
    }

    let mut actions = Vec::new();
    for (_key, (prompt_id, prompt_text, engines)) in prompt_engines {
        let truncated = truncate_text(&prompt_text, 60);
        let engine_list = engines.join(", ");
        let (priority, impact) = if engines.len() >= 3 { ("high", 8) } else if engines.len() >= 2 { ("high", 7) } else { ("medium", 5) };
        actions.push(GeneratedAction {
            action_type: "citation_fix".to_string(),
            priority: priority.to_string(),
            title: format!("No authoritative citation: \"{}\"", truncated),
            description: format!(
                "Your brand is mentioned but no authoritative citation (your domain) was included on {}. Work on getting your site cited as a source by AI engines.",
                engine_list
            ),
            impact_score: impact,
            related_prompt_ids: vec![prompt_id],
            related_engine: if engines.len() == 1 { Some(engines[0].clone()) } else { None },
        });
    }
    Ok(actions)
}

/// Find prompts where competitors dominate (mentioned in >50% of results while brand is weak)
fn find_competitor_dominance(conn: &Connection, scan_id: &str) -> rusqlite::Result<Vec<GeneratedAction>> {
    let mut stmt = conn.prepare(
        "SELECT pr.prompt_id, p.text, pr.engine, pr.competitors_mentioned, pr.brand_mentioned
         FROM parsed_results pr
         JOIN prompts p ON pr.prompt_id = p.id
         WHERE pr.scan_id = ?1
         ORDER BY p.text"
    )?;

    let rows = stmt.query_map(params![scan_id], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, bool>(4)?,
        ))
    })?;

    // Group by prompt: track brand mentions vs competitor mentions
    let mut prompt_data: HashMap<String, (String, i32, i32, Vec<String>)> = HashMap::new(); // prompt_id -> (text, brand_count, total, competitors)
    for row in rows {
        let (prompt_id, prompt_text, _engine, competitors_json, brand_mentioned) = row?;
        let entry = prompt_data.entry(prompt_id.clone()).or_insert_with(|| {
            (prompt_text, 0, 0, Vec::new())
        });
        entry.2 += 1; // total results
        if brand_mentioned {
            entry.1 += 1;
        }
        let competitors: Vec<String> = serde_json::from_str(&competitors_json).unwrap_or_default();
        for comp in competitors {
            if !entry.3.contains(&comp) {
                entry.3.push(comp);
            }
        }
    }

    let mut actions = Vec::new();
    for (prompt_id, (prompt_text, brand_count, total, competitors)) in prompt_data {
        if total == 0 || competitors.is_empty() {
            continue;
        }
        let brand_rate = brand_count as f64 / total as f64;
        // Only flag if brand mentioned <50% of the time and competitors are present
        if brand_rate < 0.5 && competitors.len() >= 2 {
            let truncated = truncate_text(&prompt_text, 60);
            let comp_list = competitors.join(", ");
            actions.push(GeneratedAction {
                action_type: "competitor_response".to_string(),
                priority: "high".to_string(),
                title: format!("Competitor dominance: \"{}\"", truncated),
                description: format!(
                    "Competitors ({}) dominate this prompt while your brand appears in only {:.0}% of results. Focus content efforts on this topic area.",
                    comp_list, brand_rate * 100.0
                ),
                impact_score: 7,
                related_prompt_ids: vec![prompt_id],
                related_engine: None,
            });
        }
    }
    Ok(actions)
}

fn truncate_text(text: &str, max_len: usize) -> String {
    if text.len() <= max_len {
        text.to_string()
    } else {
        format!("{}...", &text[..max_len])
    }
}
