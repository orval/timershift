// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/
use tauri::{
    tray::{MouseButton, TrayIcon, TrayIconBuilder, TrayIconEvent},
    Manager,
};

const TRAY_ID: &str = "timershift-tray";

fn tray_handle(app: &tauri::AppHandle) -> Option<TrayIcon> {
    app.tray_by_id(TRAY_ID)
}

fn load_tray_icon(
    app: &tauri::AppHandle,
    resource: &str,
) -> Result<tauri::image::Image<'static>, String> {
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|error| error.to_string())?;
    tauri::image::Image::from_path(resource_dir.join(resource))
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn set_tray_title(app: tauri::AppHandle, title: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let tray = tray_handle(&app).ok_or_else(|| "tray icon not found".to_string())?;
        let title = if title.is_empty() { None } else { Some(title) };
        tray.set_title(title)
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
        let icon = load_tray_icon(&app, resource)?;
        let tray = tray_handle(&app).ok_or_else(|| "tray icon not found".to_string())?;
        tray.set_icon(Some(icon))
            .map_err(|error| error.to_string())?;
        tray.set_icon_as_template(true)
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_handle = app.handle();
            if let Ok(icon) = load_tray_icon(&app_handle, "tray-icons/pause.png") {
                let tray = TrayIconBuilder::with_id(TRAY_ID)
                    .icon(icon)
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            ..
                        } = event
                        {
                            if let Some(window) = tray.app_handle().get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    })
            .build(app_handle);
                if let Ok(tray) = tray {
                    let _ = tray.set_icon_as_template(true);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            set_tray_title,
            set_tray_icon_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
