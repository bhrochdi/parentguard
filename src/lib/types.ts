// ─── PROFIL ENFANT ────────────────────────────────────
export interface Profil {
  id: string;
  prenom: string;
  avatar_color: string;
  avatar_emoji: string;
  actif: boolean;
  created_at: string;
  // Temps d'écran
  limite_quotidienne_minutes: number;   // 0 = illimité
  plages_autorisees: PlageHoraire[];
  // Sites
  mode_sites: "blacklist" | "whitelist";
  sites_bloques: string[];
  sites_autorises: string[];
  // Apps
  apps_bloquees: string[];
  // PIN de déverrouillage
}

export interface PlageHoraire {
  id: string;
  label: string;
  debut: string;   // "08:00"
  fin: string;     // "20:00"
  jours: number[]; // 0=Dim, 1=Lun ... 6=Sam
  actif: boolean;
}

// ─── SITE BLOQUÉ ──────────────────────────────────────
export interface Site {
  id: string;
  domaine: string;
  categorie: CategoreSite;
  profil_id: string;
  bloque: boolean;
  created_at: string;
}

export type CategoreSite =
  | "reseaux_sociaux"
  | "jeux"
  | "streaming"
  | "adulte"
  | "autre";

// ─── APPLICATION ──────────────────────────────────────
export interface AppBloquee {
  id: string;
  nom: string;
  executable: string; // ex: "fortnite.exe"
  profil_id: string;
  bloque: boolean;
  created_at: string;
}

// ─── LOG D'ACTIVITÉ ───────────────────────────────────
export interface LogActivite {
  id: string;
  profil_id: string;
  type: "connexion" | "site_bloque" | "app_bloquee" | "limite_atteinte" | "hors_plage";
  detail: string;
  timestamp: string;
}

// ─── STATS ────────────────────────────────────────────
export interface StatsJour {
  profil_id: string;
  date: string;
  minutes_utilisees: number;
  sites_bloques_count: number;
  apps_bloquees_count: number;
}

// ─── PARAMÈTRES GLOBAUX ───────────────────────────────
export interface Parametres {
  mot_de_passe_admin: string;
  pin_admin: string;
  demarrage_avec_windows: boolean;
  theme: "light" | "dark";
}
