#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;

use db::Db;

#[tauri::command]
fn load_db() -> Db {
    db::load()
}

#[tauri::command]
fn save_db(state: Db) -> Result<(), String> {
    db::save(&state).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_path() -> String {
    db::path().display().to_string()
}

fn main() {
    // WebKitGTK's DMABUF renderer crashes (Wayland protocol error 71) on some
    // GPU/compositor combos. Disable it before the webview initializes.
    #[cfg(target_os = "linux")]
    if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![load_db, save_db, db_path])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o app");
}
