use keyring::Entry;

// Keyring commands for secure API key storage
#[tauri::command]
fn keyring_set(service: &str, account: &str, password: &str) -> Result<(), String> {
    println!("Rust: Setting keyring - service: {}, account: {}", service, account);
    let entry = Entry::new(service, account).map_err(|e| {
        println!("Rust: Failed to create entry: {}", e);
        e.to_string()
    })?;
    entry.set_password(password).map_err(|e| {
        println!("Rust: Failed to set password: {}", e);
        e.to_string()
    })?;
    println!("Rust: Password set successfully");
    Ok(())
}

#[tauri::command]
fn keyring_get(service: &str, account: &str) -> Result<String, String> {
    println!("Rust: Getting keyring - service: {}, account: {}", service, account);
    let entry = Entry::new(service, account).map_err(|e| {
        println!("Rust: Failed to create entry for get: {}", e);
        e.to_string()
    })?;
    let password = entry.get_password().map_err(|e| {
        println!("Rust: Failed to get password: {}", e);
        e.to_string()
    })?;
    println!("Rust: Password retrieved successfully");
    Ok(password)
}

#[tauri::command]
fn keyring_delete(service: &str, account: &str) -> Result<(), String> {
    let entry = Entry::new(service, account).map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            keyring_set,
            keyring_get,
            keyring_delete
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
