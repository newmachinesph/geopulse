use rusqlite::Connection;

pub fn init_schema(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            site_url TEXT NOT NULL,
            brand_name TEXT NOT NULL,
            industry TEXT NOT NULL,
            market TEXT NOT NULL DEFAULT 'us',
            language TEXT NOT NULL DEFAULT 'en',
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS brand_profiles (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            entity_name TEXT NOT NULL,
            aliases TEXT NOT NULL DEFAULT '[]',
            competitors TEXT NOT NULL DEFAULT '[]',
            target_keywords TEXT NOT NULL DEFAULT '[]',
            validated INTEGER NOT NULL DEFAULT 0,
            validation_data TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS personas (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            demographics TEXT NOT NULL DEFAULT '{}',
            search_behavior TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS prompts (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            persona_id TEXT,
            text TEXT NOT NULL,
            intent_category TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            tags TEXT NOT NULL DEFAULT '[]',
            last_run_at TEXT,
            run_count INTEGER NOT NULL DEFAULT 0,
            avg_score REAL NOT NULL DEFAULT 0.0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            config TEXT NOT NULL DEFAULT '{}',
            status TEXT NOT NULL DEFAULT 'pending',
            progress INTEGER NOT NULL DEFAULT 0,
            total_prompts INTEGER NOT NULL DEFAULT 0,
            completed_prompts INTEGER NOT NULL DEFAULT 0,
            failed_prompts INTEGER NOT NULL DEFAULT 0,
            started_at TEXT,
            completed_at TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS raw_responses (
            id TEXT PRIMARY KEY,
            scan_id TEXT NOT NULL,
            prompt_id TEXT NOT NULL,
            engine TEXT NOT NULL,
            market TEXT NOT NULL,
            raw_text TEXT NOT NULL,
            response_time_ms INTEGER NOT NULL DEFAULT 0,
            error TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE,
            FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS parsed_results (
            id TEXT PRIMARY KEY,
            raw_response_id TEXT NOT NULL,
            scan_id TEXT NOT NULL,
            prompt_id TEXT NOT NULL,
            engine TEXT NOT NULL,
            market TEXT NOT NULL,
            brand_mentioned INTEGER NOT NULL DEFAULT 0,
            mention_position INTEGER,
            total_entities_mentioned INTEGER NOT NULL DEFAULT 0,
            sentiment_level TEXT NOT NULL DEFAULT 'neutral',
            sentiment_score REAL NOT NULL DEFAULT 0.0,
            visibility_score REAL NOT NULL DEFAULT 0.0,
            brand_context TEXT NOT NULL DEFAULT '',
            competitors_mentioned TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL,
            FOREIGN KEY (raw_response_id) REFERENCES raw_responses(id) ON DELETE CASCADE,
            FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE,
            FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS citations (
            id TEXT PRIMARY KEY,
            parsed_result_id TEXT NOT NULL,
            url TEXT NOT NULL,
            domain TEXT NOT NULL,
            title TEXT,
            source_type TEXT NOT NULL DEFAULT 'unknown',
            is_authoritative INTEGER NOT NULL DEFAULT 0,
            position INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (parsed_result_id) REFERENCES parsed_results(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS action_items (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            scan_id TEXT,
            action_type TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'medium',
            status TEXT NOT NULL DEFAULT 'pending',
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            impact_score INTEGER NOT NULL DEFAULT 0,
            related_prompt_ids TEXT NOT NULL DEFAULT '[]',
            related_engine TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY DEFAULT 'global',
            data TEXT NOT NULL DEFAULT '{}',
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            scan_id TEXT,
            alert_type TEXT NOT NULL,
            severity TEXT NOT NULL DEFAULT 'warning',
            title TEXT NOT NULL,
            message TEXT NOT NULL DEFAULT '',
            is_read INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE SET NULL
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_brand_profiles_project_id ON brand_profiles(project_id);
        CREATE INDEX IF NOT EXISTS idx_personas_project_id ON personas(project_id);
        CREATE INDEX IF NOT EXISTS idx_prompts_project_id ON prompts(project_id);
        CREATE INDEX IF NOT EXISTS idx_prompts_persona_id ON prompts(persona_id);
        CREATE INDEX IF NOT EXISTS idx_scans_project_id ON scans(project_id);
        CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
        CREATE INDEX IF NOT EXISTS idx_raw_responses_scan_id ON raw_responses(scan_id);
        CREATE INDEX IF NOT EXISTS idx_raw_responses_prompt_id ON raw_responses(prompt_id);
        CREATE INDEX IF NOT EXISTS idx_parsed_results_scan_id ON parsed_results(scan_id);
        CREATE INDEX IF NOT EXISTS idx_parsed_results_prompt_id ON parsed_results(prompt_id);
        CREATE INDEX IF NOT EXISTS idx_parsed_results_engine ON parsed_results(engine);
        CREATE INDEX IF NOT EXISTS idx_citations_parsed_result_id ON citations(parsed_result_id);
        CREATE INDEX IF NOT EXISTS idx_action_items_project_id ON action_items(project_id);
        CREATE INDEX IF NOT EXISTS idx_action_items_scan_id ON action_items(scan_id);
        CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
        CREATE INDEX IF NOT EXISTS idx_alerts_project_id ON alerts(project_id);
        CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
        CREATE INDEX IF NOT EXISTS idx_alerts_scan_id ON alerts(scan_id);
        CREATE INDEX IF NOT EXISTS idx_raw_responses_engine ON raw_responses(engine);
        CREATE INDEX IF NOT EXISTS idx_raw_responses_market ON raw_responses(market);
        CREATE INDEX IF NOT EXISTS idx_parsed_results_market ON parsed_results(market);
        CREATE INDEX IF NOT EXISTS idx_parsed_results_raw_response_id ON parsed_results(raw_response_id);
        CREATE INDEX IF NOT EXISTS idx_citations_domain ON citations(domain);
        CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);
        CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at);
        ",
    )?;
    Ok(())
}
