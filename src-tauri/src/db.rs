use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub prio: String, // "alta" | "media" | "baixa" | "none"
    pub done: bool,
    #[serde(default)]
    pub notes: String,
    pub category: String,
    pub created: String, // ISO8601
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Category {
    pub id: String,
    pub label: String,
}

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct Db {
    #[serde(default)]
    pub categories: Vec<Category>,
    #[serde(default)]
    pub tasks: Vec<Task>,
}

/// `~/.config/mise/db.json` on linux,
/// `~/Library/Application Support/mise/db.json` on macOS, etc.
pub fn path() -> PathBuf {
    let mut p = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    p.push("mise");
    let _ = fs::create_dir_all(&p);
    p.push("db.json");
    p
}

pub fn load() -> Db {
    let p = path();
    if !p.exists() {
        // start empty; the user creates their own categories
        return Db::default();
    }
    let raw = fs::read_to_string(&p).unwrap_or_default();
    serde_json::from_str(&raw).unwrap_or_default()
}

pub fn save(db: &Db) -> std::io::Result<()> {
    let p = path();
    let raw = serde_json::to_string_pretty(db).unwrap_or_else(|_| "{}".into());
    // best-effort atomic write
    let tmp = p.with_extension("json.tmp");
    fs::write(&tmp, raw)?;
    fs::rename(&tmp, &p)?;
    Ok(())
}
