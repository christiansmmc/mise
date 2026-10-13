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
    /// board column id; only meaningful when the category is a board
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Column {
    pub id: String,
    pub label: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Category {
    pub id: String,
    pub label: String,
    /// "list" | "board"; absent on files written before boards existed
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub kind: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub columns: Option<Vec<Column>>,
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

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{json, Value};

    fn roundtrip(input: Value) -> Value {
        let db: Db = serde_json::from_value(input).expect("deserialize");
        serde_json::to_value(&db).expect("serialize")
    }

    #[test]
    fn board_fields_survive_roundtrip() {
        let out = roundtrip(json!({
            "categories": [{
                "id": "proj", "label": "Proj", "kind": "board",
                "columns": [{ "id": "todo", "label": "to do" }, { "id": "done", "label": "done" }]
            }],
            "tasks": [{
                "id": "1", "title": "a", "prio": "none", "done": false, "notes": "",
                "category": "proj", "created": "2026-10-13T00:00:00.000Z", "status": "todo"
            }]
        }));
        let cat = &out["categories"][0];
        assert_eq!(cat["kind"], "board");
        assert_eq!(cat["columns"][1]["id"], "done");
        assert_eq!(cat["columns"][1]["label"], "done");
        assert_eq!(out["tasks"][0]["status"], "todo");
    }

    #[test]
    fn legacy_db_stays_byte_compatible() {
        let out = roundtrip(json!({
            "categories": [{ "id": "work", "label": "Work" }],
            "tasks": [{
                "id": "1", "title": "a", "prio": "none", "done": false,
                "category": "work", "created": "2026-10-13T00:00:00.000Z"
            }]
        }));
        assert_eq!(out["categories"][0], json!({ "id": "work", "label": "Work" }));
        assert!(out["tasks"][0].get("status").is_none());
    }
}
