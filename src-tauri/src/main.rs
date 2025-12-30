// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
use tauri::{Manager, SystemTrayEvent};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn set_tray_title(app: tauri::AppHandle, title: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        app.tray_handle()
            .set_title(&title)
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn set_tray_icon_state(app: tauri::AppHandle, state: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let resource = match state.as_str() {
            "play" => "tray-icons/play.png",
            "pause" => "tray-icons/pause.png",
            _ => return Ok(()),
        };
        let path = app
            .path_resolver()
            .resolve_resource(resource)
            .ok_or_else(|| format!("missing tray icon resource: {}", resource))?;
        app.tray_handle()
            .set_icon(tauri::Icon::File(path))
            .map_err(|error| error.to_string())?;
        app.tray_handle()
            .set_icon_as_template(true)
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn main() {
    let tray = tauri::SystemTray::new().with_menu(tauri::SystemTrayMenu::new());

    tauri::Builder::default()
        .system_tray(tray)
        .on_system_tray_event(|app, event| {
            if matches!(event, SystemTrayEvent::LeftClick { .. }) {
                if let Some(window) = app.get_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![greet, set_tray_title, set_tray_icon_state])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
