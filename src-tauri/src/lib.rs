use tauri::Manager;

// ── Commandes système ────────────────────────────────

/// Bloquer un site via le fichier hosts (Windows + macOS)
#[tauri::command]
fn block_site(domaine: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let hosts_path = r"C:\Windows\System32\drivers\etc\hosts";
        let entry = format!("127.0.0.1 {}\n127.0.0.1 www.{}\n", domaine, domaine);
        
        let content = std::fs::read_to_string(hosts_path)
            .map_err(|e| format!("Lecture hosts: {}", e))?;
        
        if !content.contains(&format!("127.0.0.1 {}", domaine)) {
            std::fs::OpenOptions::new()
                .append(true)
                .open(hosts_path)
                .and_then(|mut f| { use std::io::Write; f.write_all(entry.as_bytes()) })
                .map_err(|e| format!("Écriture hosts: {} — Lancez en administrateur", e))?;
        }
    }
    #[cfg(target_os = "macos")]
    {
        let hosts_path = "/etc/hosts";
        let entry = format!("127.0.0.1 {}\n127.0.0.1 www.{}\n", domaine, domaine);
        let content = std::fs::read_to_string(hosts_path)
            .map_err(|e| format!("Lecture hosts: {}", e))?;
        if !content.contains(&format!("127.0.0.1 {}", domaine)) {
            std::fs::OpenOptions::new()
                .append(true)
                .open(hosts_path)
                .and_then(|mut f| { use std::io::Write; f.write_all(entry.as_bytes()) })
                .map_err(|e| format!("Écriture hosts: {}", e))?;
        }
    }
    Ok(format!("Site {} bloqué", domaine))
}

/// Débloquer un site (supprimer les entrées hosts)
#[tauri::command]
fn unblock_site(domaine: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    let hosts_path = r"C:\Windows\System32\drivers\etc\hosts";
    #[cfg(target_os = "macos")]
    let hosts_path = "/etc/hosts";
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    let hosts_path = "/etc/hosts";

    let content = std::fs::read_to_string(hosts_path)
        .map_err(|e| format!("Lecture: {}", e))?;

    let filtered: String = content
        .lines()
        .filter(|l| !l.contains(&domaine))
        .map(|l| format!("{}\n", l))
        .collect();

    std::fs::write(hosts_path, filtered)
        .map_err(|e| format!("Écriture: {}", e))?;

    Ok(format!("Site {} débloqué", domaine))
}

/// Couper internet (Windows: désactiver l'adaptateur réseau)
#[tauri::command]
fn cut_internet() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("netsh")
            .args(["interface", "set", "interface", "Wi-Fi", "disable"])
            .output()
            .map_err(|e| format!("Erreur netsh: {}", e))?;
        std::process::Command::new("netsh")
            .args(["interface", "set", "interface", "Ethernet", "disable"])
            .output()
            .map_err(|e| format!("Erreur netsh: {}", e))?;
    }
    Ok("Internet coupé".into())
}

/// Rétablir internet
#[tauri::command]
fn restore_internet() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("netsh")
            .args(["interface", "set", "interface", "Wi-Fi", "enable"])
            .output()
            .map_err(|e| format!("Erreur netsh: {}", e))?;
        std::process::Command::new("netsh")
            .args(["interface", "set", "interface", "Ethernet", "enable"])
            .output()
            .map_err(|e| format!("Erreur netsh: {}", e))?;
    }
    Ok("Internet rétabli".into())
}

/// Terminer un processus par nom
#[tauri::command]
fn kill_process(executable: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("taskkill")
            .args(["/F", "/IM", &executable])
            .output()
            .map_err(|e| format!("Erreur taskkill: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("killall")
            .arg(&executable)
            .output()
            .map_err(|e| format!("Erreur killall: {}", e))?;
    }
    Ok(format!("Processus {} terminé", executable))
}

/// Lister les processus actifs
#[tauri::command]
fn list_processes() -> Result<Vec<String>, String> {
    #[cfg(target_os = "windows")]
    {
        let output = std::process::Command::new("tasklist")
            .args(["/fo", "csv", "/nh"])
            .output()
            .map_err(|e| format!("Erreur tasklist: {}", e))?;

        let text = String::from_utf8_lossy(&output.stdout);
        let processes: Vec<String> = text
            .lines()
            .filter_map(|l| {
                let parts: Vec<&str> = l.split(',').collect();
                parts.first().map(|s| s.trim_matches('"').to_string())
            })
            .collect();
        return Ok(processes);
    }
    #[cfg(not(target_os = "windows"))]
    Ok(vec!["chrome".into(), "firefox".into()])
}

// ── App setup ────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            block_site,
            unblock_site,
            cut_internet,
            restore_internet,
            kill_process,
            list_processes,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            if let Some(w) = app.get_webview_window("main") {
                w.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Erreur au démarrage de ParentGuard");
}
