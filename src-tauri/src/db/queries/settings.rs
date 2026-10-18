use rusqlite::{params, Connection};
use crate::models::GeoSettings;

pub fn get_settings(conn: &Connection) -> rusqlite::Result<Option<GeoSettings>> {
    let mut stmt = conn.prepare("SELECT data FROM settings WHERE id = 'global'")?;
    let mut rows = stmt.query_map([], |row| {
        let data: String = row.get(0)?;
        Ok(data)
    })?;
    match rows.next() {
        Some(row) => {
            let data = row?;
            match serde_json::from_str::<GeoSettings>(&data) {
                Ok(settings) => Ok(Some(settings)),
                Err(_) => Ok(None),
            }
        }
        None => Ok(None),
    }
}

pub fn update_settings(conn: &Connection, settings: &GeoSettings) -> rusqlite::Result<bool> {
    let now = chrono::Utc::now().to_rfc3339();
    let data = serde_json::to_string(settings).unwrap_or_else(|_| "{}".to_string());
    conn.execute(
        "INSERT INTO settings (id, data, updated_at) VALUES ('global', ?1, ?2)
         ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
        params![data, now],
    )?;
    Ok(true)
}
