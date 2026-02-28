use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use tauri::Manager;

// ─── STRUCTURES DE RÈGLES ────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PlageHoraire {
    pub debut: String,  // "08:00"
    pub fin: String,    // "20:00"
    pub jours: Vec<u8>, // 0=Dim, 1=Lun ... 6=Sam
    pub actif: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Regles {
    pub profil_id: String,
    pub apps_bloquees: Vec<String>,       // ["fortnite.exe", "roblox.exe"]
    pub sites_bloques: Vec<String>,       // ["tiktok.com", "instagram.com"]
    pub limite_minutes: u32,              // 0 = illimité
    pub plages: Vec<PlageHoraire>,        // plages horaires autorisées
    pub actif: bool,                      // monitoring activé ou non
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct EtatMonitoring {
    pub regles: Regles,
    pub minutes_utilisees: u32,
    pub internet_coupe: bool,
    pub derniere_verification: String,
}

// ─── ÉTAT PARTAGÉ ────────────────────────────────────

type EtatPartagé = Arc<Mutex<EtatMonitoring>>;

// ─── HELPERS SYSTÈME ─────────────────────────────────

/// Lire le fichier hosts
fn lire_hosts() -> String {
    #[cfg(target_os = "windows")]
    let path = r"C:\Windows\System32\drivers\etc\hosts";
    #[cfg(not(target_os = "windows"))]
    let path = "/etc/hosts";
    std::fs::read_to_string(path).unwrap_or_default()
}

/// Écrire le fichier hosts
fn ecrire_hosts(contenu: &str) -> bool {
    #[cfg(target_os = "windows")]
    let path = r"C:\Windows\System32\drivers\etc\hosts";
    #[cfg(not(target_os = "windows"))]
    let path = "/etc/hosts";
    std::fs::write(path, contenu).is_ok()
}

/// Vider le cache DNS après modification hosts
fn vider_dns_cache() {
    #[cfg(target_os = "windows")]
    { let _ = std::process::Command::new("ipconfig").args(["/flushdns"]).output(); }
    #[cfg(target_os = "macos")]
    { let _ = std::process::Command::new("dscacheutil").args(["-flushcache"]).output(); }
}

/// Appliquer les sites bloqués dans le fichier hosts
fn appliquer_blocage_sites(sites: &[String]) {
    let contenu = lire_hosts();
    
    // Supprimer les anciennes entrées ParentGuard
    let mut lignes: Vec<&str> = contenu.lines()
        .filter(|l| !l.contains("# ParentGuard"))
        .collect();

    // Ajouter les nouvelles entrées
    lignes.push("# ParentGuard - Ne pas modifier");
    for site in sites {
        let site = site.trim();
        if !site.is_empty() {
            lignes.push(Box::leak(format!("127.0.0.1 {} # ParentGuard", site).into_boxed_str()));
            lignes.push(Box::leak(format!("127.0.0.1 www.{} # ParentGuard", site).into_boxed_str()));
        }
    }

    let nouveau = lignes.join("\n") + "\n";
    if ecrire_hosts(&nouveau) {
        vider_dns_cache();
    }
}

/// Supprimer tous les blocages ParentGuard du fichier hosts
fn supprimer_blocage_sites() {
    let contenu = lire_hosts();
    let filtre: String = contenu.lines()
        .filter(|l| !l.contains("# ParentGuard"))
        .map(|l| format!("{}\n", l))
        .collect();
    if ecrire_hosts(&filtre) {
        vider_dns_cache();
    }
}

/// Couper internet
fn couper_internet() {
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("netsh")
            .args(["interface", "set", "interface", "Wi-Fi", "disable"])
            .output();
        let _ = std::process::Command::new("netsh")
            .args(["interface", "set", "interface", "Ethernet", "disable"])
            .output();
    }
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("networksetup")
            .args(["-setairportpower", "en0", "off"])
            .output();
    }
}

/// Rétablir internet
fn retablir_internet() {
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("netsh")
            .args(["interface", "set", "interface", "Wi-Fi", "enable"])
            .output();
        let _ = std::process::Command::new("netsh")
            .args(["interface", "set", "interface", "Ethernet", "enable"])
            .output();
    }
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("networksetup")
            .args(["-setairportpower", "en0", "on"])
            .output();
    }
}

/// Tuer un processus par nom
fn tuer_processus(executable: &str) -> bool {
    #[cfg(target_os = "windows")]
    {
        let result = std::process::Command::new("taskkill")
            .args(["/F", "/IM", executable])
            .output();
        return result.map(|o| o.status.success()).unwrap_or(false);
    }
    #[cfg(target_os = "macos")]
    {
        let name = executable.trim_end_matches(".exe").trim_end_matches(".app");
        let result = std::process::Command::new("killall")
            .args(["-9", name])
            .output();
        return result.map(|o| o.status.success()).unwrap_or(false);
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    false
}

/// Lister les processus actifs
fn processus_actifs() -> Vec<String> {
    #[cfg(target_os = "windows")]
    {
        let output = std::process::Command::new("tasklist")
            .args(["/fo", "csv", "/nh"])
            .output()
            .unwrap_or_default();
        let text = String::from_utf8_lossy(&output.stdout);
        return text.lines()
            .filter_map(|l| {
                let parts: Vec<&str> = l.split(',').collect();
                parts.first().map(|s| s.trim_matches('"').to_lowercase())
            })
            .collect();
    }
    #[cfg(target_os = "macos")]
    {
        let output = std::process::Command::new("ps")
            .args(["-ax", "-o", "comm="])
            .output()
            .unwrap_or_default();
        let text = String::from_utf8_lossy(&output.stdout);
        return text.lines()
            .map(|l| l.trim().to_lowercase())
            .collect();
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    vec![]
}

/// Vérifier si l'heure actuelle est dans une plage autorisée
fn dans_plage_autorisee(plages: &[PlageHoraire]) -> bool {
    // Si aucune plage définie → toujours autorisé
    if plages.is_empty() || plages.iter().all(|p| !p.actif) {
        return true;
    }

    let now = chrono_heure_actuelle();
    let jour_actuel = chrono_jour_actuel();

    for plage in plages {
        if !plage.actif { continue; }
        if !plage.jours.contains(&jour_actuel) { continue; }

        let debut = parse_heure(&plage.debut);
        let fin   = parse_heure(&plage.fin);

        if now >= debut && now <= fin {
            return true;
        }
    }
    false
}

/// Obtenir l'heure actuelle en minutes depuis minuit
fn chrono_heure_actuelle() -> u32 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let secs_since_midnight = secs % 86400;
    // Ajuster avec le fuseau horaire local (approximation UTC+1)
    let local_secs = (secs_since_midnight + 3600) % 86400;
    (local_secs / 60) as u32
}

/// Obtenir le jour de la semaine (0=Dim, 1=Lun ... 6=Sam)
fn chrono_jour_actuel() -> u8 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    // 1970-01-01 était un Jeudi (4)
    ((secs / 86400 + 4) % 7) as u8
}

/// Parser une heure "HH:MM" en minutes depuis minuit
fn parse_heure(heure: &str) -> u32 {
    let parts: Vec<&str> = heure.split(':').collect();
    if parts.len() < 2 { return 0; }
    let h = parts[0].parse::<u32>().unwrap_or(0);
    let m = parts[1].parse::<u32>().unwrap_or(0);
    h * 60 + m
}

// ─── BOUCLE DE MONITORING ────────────────────────────

fn boucle_monitoring(etat: EtatPartagé) {
    loop {
        thread::sleep(Duration::from_secs(30));

        let (regles, minutes, internet_coupe) = {
            let e = etat.lock().unwrap();
            (e.regles.clone(), e.minutes_utilisees, e.internet_coupe)
        };

        if !regles.actif { continue; }

        // ── 1. Bloquer les applications ──────────────
        let actifs = processus_actifs();
        for app in &regles.apps_bloquees {
            let app_lower = app.to_lowercase();
            if actifs.iter().any(|p| p.contains(&app_lower)) {
                tuer_processus(app);
                println!("[ParentGuard] App bloquée : {}", app);
            }
        }

        // ── 2. Vérifier les plages horaires ──────────
        let dans_plage = dans_plage_autorisee(&regles.plages);
        
        if !dans_plage && !internet_coupe {
            // Hors plage → couper internet
            couper_internet();
            etat.lock().unwrap().internet_coupe = true;
            println!("[ParentGuard] Internet coupé (hors plage horaire)");
        } else if dans_plage && internet_coupe {
            // Dans la plage → rétablir internet
            retablir_internet();
            etat.lock().unwrap().internet_coupe = false;
            println!("[ParentGuard] Internet rétabli");
        }

        // ── 3. Vérifier la limite de temps ───────────
        if regles.limite_minutes > 0 {
            let nouvelles_minutes = minutes + 1; // +1 toutes les 30s (approximation)
            etat.lock().unwrap().minutes_utilisees = nouvelles_minutes;

            if nouvelles_minutes >= regles.limite_minutes && !internet_coupe {
                couper_internet();
                etat.lock().unwrap().internet_coupe = true;
                println!("[ParentGuard] Limite de temps atteinte ({} min)", nouvelles_minutes);
            }
        }

        // ── 4. Maintenir les sites bloqués ───────────
        if !regles.sites_bloques.is_empty() {
            appliquer_blocage_sites(&regles.sites_bloques);
        }
    }
}

// ─── COMMANDES TAURI ─────────────────────────────────

/// Mettre à jour les règles actives
#[tauri::command]
fn update_rules(
    etat: tauri::State<EtatPartagé>,
    regles: Regles,
) -> Result<String, String> {
    // Appliquer immédiatement les sites bloqués
    if !regles.sites_bloques.is_empty() {
        appliquer_blocage_sites(&regles.sites_bloques);
    } else {
        supprimer_blocage_sites();
    }

    let mut e = etat.lock().map_err(|e| e.to_string())?;
    e.regles = regles;
    e.minutes_utilisees = 0; // Reset au changement de profil
    
    Ok("Règles mises à jour".into())
}

/// Obtenir le temps d'écran actuel
#[tauri::command]
fn get_screen_time(etat: tauri::State<EtatPartagé>) -> u32 {
    etat.lock().map(|e| e.minutes_utilisees).unwrap_or(0)
}

/// Désactiver le monitoring (mode parent)
#[tauri::command]
fn stop_monitoring(etat: tauri::State<EtatPartagé>) -> Result<String, String> {
    let mut e = etat.lock().map_err(|e| e.to_string())?;
    e.regles.actif = false;
    // Rétablir internet si coupé
    if e.internet_coupe {
        retablir_internet();
        e.internet_coupe = false;
    }
    supprimer_blocage_sites();
    Ok("Monitoring désactivé".into())
}

/// Activer le monitoring (mode enfant)
#[tauri::command]
fn start_monitoring(etat: tauri::State<EtatPartagé>) -> Result<String, String> {
    let mut e = etat.lock().map_err(|e| e.to_string())?;
    e.regles.actif = true;
    Ok("Monitoring activé".into())
}

/// Bloquer un site manuellement
#[tauri::command]
fn block_site(domaine: String) -> Result<String, String> {
    let mut sites = vec![domaine.clone()];
    appliquer_blocage_sites(&sites);
    Ok(format!("Site {} bloqué", domaine))
}

/// Débloquer un site manuellement  
#[tauri::command]
fn unblock_site(domaine: String) -> Result<String, String> {
    let contenu = lire_hosts();
    let filtre: String = contenu.lines()
        .filter(|l| !(l.contains(&domaine) && l.contains("# ParentGuard")))
        .map(|l| format!("{}\n", l))
        .collect();
    ecrire_hosts(&filtre);
    vider_dns_cache();
    Ok(format!("Site {} débloqué", domaine))
}

/// Tuer un processus
#[tauri::command]
fn kill_process(executable: String) -> Result<String, String> {
    tuer_processus(&executable);
    Ok(format!("Processus {} terminé", executable))
}

/// Lister les processus actifs
#[tauri::command]
fn list_processes() -> Vec<String> {
    processus_actifs()
}

/// Couper internet manuellement
#[tauri::command]
fn cut_internet(etat: tauri::State<EtatPartagé>) -> Result<String, String> {
    couper_internet();
    etat.lock().unwrap().internet_coupe = true;
    Ok("Internet coupé".into())
}

/// Rétablir internet manuellement
#[tauri::command]
fn restore_internet(etat: tauri::State<EtatPartagé>) -> Result<String, String> {
    retablir_internet();
    etat.lock().unwrap().internet_coupe = false;
    Ok("Internet rétabli".into())
}

// ─── DÉMARRAGE ───────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Créer l'état partagé
    let etat: EtatPartagé = Arc::new(Mutex::new(EtatMonitoring::default()));
    let etat_thread = Arc::clone(&etat);

    // Lancer le thread de monitoring en arrière-plan
    thread::spawn(move || {
        boucle_monitoring(etat_thread);
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(etat)
        .invoke_handler(tauri::generate_handler![
            update_rules,
            get_screen_time,
            start_monitoring,
            stop_monitoring,
            block_site,
            unblock_site,
            kill_process,
            list_processes,
            cut_internet,
            restore_internet,
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
