use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use serde::{Deserialize, Serialize};

// ─── STRUCTURES ───────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PlageHoraire {
    pub debut: String,
    pub fin: String,
    pub jours: Vec<u8>,
    pub actif: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Regles {
    pub profil_id: String,
    pub apps_bloquees: Vec<String>,
    pub sites_bloques: Vec<String>,
    pub limite_minutes: u32,
    pub plages: Vec<PlageHoraire>,
    pub actif: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct EtatMonitoring {
    pub regles: Regles,
    pub minutes_utilisees: u32,
    pub internet_coupe: bool,
}

type EtatPartagé = Arc<Mutex<EtatMonitoring>>;

// ─── HELPERS FICHIER HOSTS ────────────────────────────

fn lire_hosts() -> String {
    #[cfg(target_os = "windows")]
    let path = r"C:\Windows\System32\drivers\etc\hosts";
    #[cfg(not(target_os = "windows"))]
    let path = "/etc/hosts";
    std::fs::read_to_string(path).unwrap_or_default()
}

fn ecrire_hosts(contenu: &str) -> bool {
    #[cfg(target_os = "windows")]
    let path = r"C:\Windows\System32\drivers\etc\hosts";
    #[cfg(not(target_os = "windows"))]
    let path = "/etc/hosts";
    std::fs::write(path, contenu).is_ok()
}

fn vider_dns_cache() {
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("ipconfig").args(["/flushdns"]).output();
    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("dscacheutil").args(["-flushcache"]).output();
}

fn appliquer_blocage_sites(sites: &[String]) {
    let contenu = lire_hosts();
    let mut lignes: Vec<String> = contenu
        .lines()
        .filter(|l| !l.contains("# ParentGuard"))
        .map(|l| l.to_string())
        .collect();

    lignes.push("# ParentGuard - Ne pas modifier".to_string());
    for site in sites {
        let site = site.trim();
        if !site.is_empty() {
            lignes.push(format!("127.0.0.1 {} # ParentGuard", site));
            lignes.push(format!("127.0.0.1 www.{} # ParentGuard", site));
        }
    }

    let nouveau = lignes.join("\n") + "\n";
    if ecrire_hosts(&nouveau) {
        vider_dns_cache();
    }
}

fn supprimer_blocage_sites() {
    let contenu = lire_hosts();
    let filtre: String = contenu
        .lines()
        .filter(|l| !l.contains("# ParentGuard"))
        .map(|l| format!("{}\n", l))
        .collect();
    if ecrire_hosts(&filtre) {
        vider_dns_cache();
    }
}

// ─── HELPERS RÉSEAU ───────────────────────────────────

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

// ─── HELPERS PROCESSUS ────────────────────────────────

fn tuer_processus(executable: &str) {
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("taskkill")
        .args(["/F", "/IM", executable])
        .output();
    #[cfg(target_os = "macos")]
    {
        let name = executable.trim_end_matches(".exe").trim_end_matches(".app");
        let _ = std::process::Command::new("killall").args(["-9", name]).output();
    }
}

fn processus_actifs() -> Vec<String> {
    #[cfg(target_os = "windows")]
    {
        let output = std::process::Command::new("tasklist")
            .args(["/fo", "csv", "/nh"])
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
            .unwrap_or_default();
        return output
            .lines()
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
            .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
            .unwrap_or_default();
        return output.lines().map(|l| l.trim().to_lowercase()).collect();
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    vec![]
}

// ─── HELPERS TEMPS ────────────────────────────────────

fn heure_en_minutes() -> u32 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    ((secs % 86400) / 60) as u32
}

fn jour_actuel() -> u8 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    ((secs / 86400 + 4) % 7) as u8
}

fn parse_heure(heure: &str) -> u32 {
    let parts: Vec<&str> = heure.split(':').collect();
    if parts.len() < 2 { return 0; }
    let h = parts[0].parse::<u32>().unwrap_or(0);
    let m = parts[1].parse::<u32>().unwrap_or(0);
    h * 60 + m
}

fn dans_plage_autorisee(plages: &[PlageHoraire]) -> bool {
    if plages.is_empty() || plages.iter().all(|p| !p.actif) {
        return true;
    }
    let now = heure_en_minutes();
    let jour = jour_actuel();
    for plage in plages {
        if !plage.actif { continue; }
        if !plage.jours.contains(&jour) { continue; }
        if now >= parse_heure(&plage.debut) && now <= parse_heure(&plage.fin) {
            return true;
        }
    }
    false
}

// ─── BOUCLE MONITORING ────────────────────────────────

fn boucle_monitoring(etat: EtatPartagé) {
    loop {
        thread::sleep(Duration::from_secs(30));

        let (regles, minutes, internet_coupe) = {
            let e = etat.lock().unwrap();
            (e.regles.clone(), e.minutes_utilisees, e.internet_coupe)
        };

        if !regles.actif { continue; }

        // 1. Bloquer les apps
        let actifs = processus_actifs();
        for app in &regles.apps_bloquees {
            let app_lower = app.to_lowercase();
            if actifs.iter().any(|p| p.contains(&app_lower)) {
                tuer_processus(app);
            }
        }

        // 2. Vérifier plages horaires
        let dans_plage = dans_plage_autorisee(&regles.plages);
        if !dans_plage && !internet_coupe {
            couper_internet();
            etat.lock().unwrap().internet_coupe = true;
        } else if dans_plage && internet_coupe && regles.limite_minutes == 0 {
            retablir_internet();
            etat.lock().unwrap().internet_coupe = false;
        }

        // 3. Vérifier limite de temps
        if regles.limite_minutes > 0 {
            let nouvelles_minutes = minutes + 1;
            etat.lock().unwrap().minutes_utilisees = nouvelles_minutes;
            if nouvelles_minutes >= regles.limite_minutes && !internet_coupe {
                couper_internet();
                etat.lock().unwrap().internet_coupe = true;
            }
        }

        // 4. Maintenir les sites bloqués
        if !regles.sites_bloques.is_empty() {
            appliquer_blocage_sites(&regles.sites_bloques);
        }
    }
}

// ─── COMMANDES TAURI ─────────────────────────────────

#[tauri::command]
fn update_rules(etat: tauri::State<EtatPartagé>, regles: Regles) -> Result<String, String> {
    if !regles.sites_bloques.is_empty() {
        appliquer_blocage_sites(&regles.sites_bloques);
    } else {
        supprimer_blocage_sites();
    }
    let mut e = etat.lock().map_err(|e| e.to_string())?;
    e.regles = regles;
    e.minutes_utilisees = 0;
    Ok("Règles mises à jour".into())
}

#[tauri::command]
fn get_screen_time(etat: tauri::State<EtatPartagé>) -> u32 {
    etat.lock().map(|e| e.minutes_utilisees).unwrap_or(0)
}

#[tauri::command]
fn start_monitoring(etat: tauri::State<EtatPartagé>) -> Result<String, String> {
    etat.lock().map_err(|e| e.to_string())?.regles.actif = true;
    Ok("Monitoring activé".into())
}

#[tauri::command]
fn stop_monitoring(etat: tauri::State<EtatPartagé>) -> Result<String, String> {
    let mut e = etat.lock().map_err(|e| e.to_string())?;
    e.regles.actif = false;
    if e.internet_coupe {
        retablir_internet();
        e.internet_coupe = false;
    }
    supprimer_blocage_sites();
    Ok("Monitoring désactivé".into())
}

#[tauri::command]
fn block_site(domaine: String) -> Result<String, String> {
    let sites = vec![domaine.clone()];
    appliquer_blocage_sites(&sites);
    Ok(format!("Site {} bloqué", domaine))
}

#[tauri::command]
fn unblock_site(domaine: String) -> Result<String, String> {
    let contenu = lire_hosts();
    let filtre: String = contenu
        .lines()
        .filter(|l| !(l.contains(&domaine.as_str()) && l.contains("# ParentGuard")))
        .map(|l| format!("{}\n", l))
        .collect();
    ecrire_hosts(&filtre);
    vider_dns_cache();
    Ok(format!("Site {} débloqué", domaine))
}

#[tauri::command]
fn kill_process(executable: String) -> Result<String, String> {
    tuer_processus(&executable);
    Ok(format!("Processus {} terminé", executable))
}

#[tauri::command]
fn list_processes() -> Vec<String> {
    processus_actifs()
}

#[tauri::command]
fn cut_internet(etat: tauri::State<EtatPartagé>) -> Result<String, String> {
    couper_internet();
    etat.lock().unwrap().internet_coupe = true;
    Ok("Internet coupé".into())
}

#[tauri::command]
fn restore_internet(etat: tauri::State<EtatPartagé>) -> Result<String, String> {
    retablir_internet();
    etat.lock().unwrap().internet_coupe = false;
    Ok("Internet rétabli".into())
}

// ─── DÉMARRAGE ───────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let etat: EtatPartagé = Arc::new(Mutex::new(EtatMonitoring::default()));
    let etat_thread = Arc::clone(&etat);

    thread::spawn(move || { boucle_monitoring(etat_thread); });

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(etat)
        .invoke_handler(tauri::generate_handler![
            update_rules, get_screen_time,
            start_monitoring, stop_monitoring,
            block_site, unblock_site,
            kill_process, list_processes,
            cut_internet, restore_internet,
        ])
        .setup(|_app| { Ok(()) })
        .run(tauri::generate_context!())
        .expect("Erreur au démarrage de ParentGuard");
}
