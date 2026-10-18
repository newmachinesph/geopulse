use rusqlite::Connection;

/// Each migration has a version number and SQL to execute.
struct Migration {
    version: i64,
    description: &'static str,
    sql: &'static str,
}

/// All migrations in order. Add new migrations to the end of this list.
/// NEVER modify existing migrations — always add new ones.
const MIGRATIONS: &[Migration] = &[
    // Migration 1: initial schema is handled by schema.rs,
    // so the first migration starts at version 2 for future changes.
    //
    // Example future migration:
    // Migration {
    //     version: 2,
    //     description: "Add scan_tags column to scans table",
    //     sql: "ALTER TABLE scans ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';",
    // },
];

/// Ensure the migrations tracking table exists.
fn ensure_migrations_table(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migrations (
            version INTEGER PRIMARY KEY,
            description TEXT NOT NULL,
            applied_at TEXT NOT NULL
        );"
    )
}

/// Get the current schema version (highest applied migration).
fn current_version(conn: &Connection) -> rusqlite::Result<i64> {
    // Table might not exist yet in older databases
    let exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='_migrations'",
        [],
        |row| row.get(0),
    )?;
    if !exists {
        return Ok(0);
    }
    conn.query_row(
        "SELECT COALESCE(MAX(version), 0) FROM _migrations",
        [],
        |row| row.get(0),
    )
}

/// Run all pending migrations. Called on app startup after init_schema.
pub fn run_migrations(conn: &Connection) -> rusqlite::Result<()> {
    ensure_migrations_table(conn)?;
    let current = current_version(conn)?;

    for migration in MIGRATIONS {
        if migration.version > current {
            conn.execute_batch(migration.sql)?;
            let now = chrono::Utc::now().to_rfc3339();
            conn.execute(
                "INSERT INTO _migrations (version, description, applied_at) VALUES (?1, ?2, ?3)",
                rusqlite::params![migration.version, migration.description, now],
            )?;
        }
    }

    Ok(())
}
