import type {
  AppBloquee, LogActivite, Parametres, PlageHoraire,
  Profil, Site, StatsJour,
} from "./types";

// ─── HELPERS ──────────────────────────────────────────
function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function set(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── PROFILS ──────────────────────────────────────────
export const ProfilStore = {
  list(): Profil[] { return get<Profil[]>("pg_profils", []); },
  get(id: string): Profil | undefined { return this.list().find((p) => p.id === id); },
  create(data: Omit<Profil, "id" | "created_at">): Profil {
    const profil: Profil = { ...data, id: uid(), created_at: new Date().toISOString() };
    const list = this.list(); list.push(profil); set("pg_profils", list); return profil;
  },
  update(id: string, data: Partial<Profil>): void {
    set("pg_profils", this.list().map((p) => p.id === id ? { ...p, ...data } : p));
  },
  delete(id: string): void {
    set("pg_profils", this.list().filter((p) => p.id !== id));
    SiteStore.deleteByProfil(id); AppStore.deleteByProfil(id); LogStore.deleteByProfil(id);
  },
};

// ─── SITES ────────────────────────────────────────────
export const SiteStore = {
  list(profilId?: string): Site[] {
    const all = get<Site[]>("pg_sites", []);
    return profilId ? all.filter((s) => s.profil_id === profilId) : all;
  },
  add(data: Omit<Site, "id" | "created_at">): Site {
    const site: Site = { ...data, id: uid(), created_at: new Date().toISOString() };
    const list = get<Site[]>("pg_sites", []); list.push(site); set("pg_sites", list); return site;
  },
  delete(id: string): void { set("pg_sites", get<Site[]>("pg_sites", []).filter((s) => s.id !== id)); },
  deleteByProfil(profilId: string): void {
    set("pg_sites", get<Site[]>("pg_sites", []).filter((s) => s.profil_id !== profilId));
  },
  toggle(id: string): void {
    set("pg_sites", get<Site[]>("pg_sites", []).map((s) => s.id === id ? { ...s, bloque: !s.bloque } : s));
  },
};

// ─── APPLICATIONS ─────────────────────────────────────
export const AppStore = {
  list(profilId?: string): AppBloquee[] {
    const all = get<AppBloquee[]>("pg_apps", []);
    return profilId ? all.filter((a) => a.profil_id === profilId) : all;
  },
  add(data: Omit<AppBloquee, "id" | "created_at">): AppBloquee {
    const app: AppBloquee = { ...data, id: uid(), created_at: new Date().toISOString() };
    const list = get<AppBloquee[]>("pg_apps", []); list.push(app); set("pg_apps", list); return app;
  },
  delete(id: string): void { set("pg_apps", get<AppBloquee[]>("pg_apps", []).filter((a) => a.id !== id)); },
  deleteByProfil(profilId: string): void {
    set("pg_apps", get<AppBloquee[]>("pg_apps", []).filter((a) => a.profil_id !== profilId));
  },
  toggle(id: string): void {
    set("pg_apps", get<AppBloquee[]>("pg_apps", []).map((a) => a.id === id ? { ...a, bloque: !a.bloque } : a));
  },
};

// ─── LOGS ─────────────────────────────────────────────
export const LogStore = {
  list(profilId?: string, limit = 50): LogActivite[] {
    const all = get<LogActivite[]>("pg_logs", []);
    const filtered = profilId ? all.filter((l) => l.profil_id === profilId) : all;
    return filtered.slice(-limit).reverse();
  },
  add(data: Omit<LogActivite, "id" | "timestamp">): void {
    const log: LogActivite = { ...data, id: uid(), timestamp: new Date().toISOString() };
    const list = get<LogActivite[]>("pg_logs", []);
    list.push(log);
    if (list.length > 500) list.splice(0, list.length - 500);
    set("pg_logs", list);
  },
  deleteByProfil(profilId: string): void {
    set("pg_logs", get<LogActivite[]>("pg_logs", []).filter((l) => l.profil_id !== profilId));
  },
};

// ─── STATS ────────────────────────────────────────────
export const StatsStore = {
  today(profilId: string): StatsJour {
    const today = new Date().toISOString().split("T")[0];
    const all = get<StatsJour[]>("pg_stats", []);
    return all.find((s) => s.profil_id === profilId && s.date === today) ?? {
      profil_id: profilId, date: today, minutes_utilisees: 0, sites_bloques_count: 0, apps_bloquees_count: 0,
    };
  },
  week(profilId: string): StatsJour[] {
    const all = get<StatsJour[]>("pg_stats", []);
    const days: StatsJour[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const date = d.toISOString().split("T")[0];
      days.push(all.find((s) => s.profil_id === profilId && s.date === date) ?? {
        profil_id: profilId, date, minutes_utilisees: 0, sites_bloques_count: 0, apps_bloquees_count: 0,
      });
    }
    return days;
  },
  updateMinutes(profilId: string, minutes: number): void {
    const today = new Date().toISOString().split("T")[0];
    const all = get<StatsJour[]>("pg_stats", []);
    const idx = all.findIndex((s) => s.profil_id === profilId && s.date === today);
    if (idx >= 0) { all[idx].minutes_utilisees = minutes; }
    else { all.push({ profil_id: profilId, date: today, minutes_utilisees: minutes, sites_bloques_count: 0, apps_bloquees_count: 0 }); }
    set("pg_stats", all);
  },
};

// ─── PARAMÈTRES ───────────────────────────────────────
export const ParamsStore = {
  get(): Parametres {
    return get<Parametres>("pg_params", {
      mot_de_passe_admin: "admin1234", pin_admin: "1234",
      demarrage_avec_windows: false, theme: "light",
    });
  },
  save(data: Partial<Parametres>): void { set("pg_params", { ...this.get(), ...data }); },
};

// ─── SYNCHRONISATION AVEC RUST ────────────────────────
// Envoie les règles du profil actif au service de monitoring Rust

export async function syncReglesToRust(profil: Profil): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");

    const sites = SiteStore.list(profil.id)
      .filter((s) => s.bloque)
      .map((s) => s.domaine);

    const apps = AppStore.list(profil.id)
      .filter((a) => a.bloque)
      .map((a) => a.executable);

    const regles = {
      profil_id: profil.id,
      apps_bloquees: apps,
      sites_bloques: sites,
      limite_minutes: profil.limite_quotidienne_minutes,
      plages: profil.plages_autorisees ?? [],
      actif: true,
    };

    await invoke("update_rules", { regles });
    await invoke("start_monitoring");
    console.log("[ParentGuard] Règles synchronisées avec le service Rust", regles);
  } catch (err) {
    console.warn("[ParentGuard] Mode dev — Rust non disponible:", err);
  }
}

export async function stopMonitoring(): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("stop_monitoring");
  } catch {
    // Mode dev
  }
}

export async function getScreenTimeFromRust(): Promise<number> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<number>("get_screen_time");
  } catch {
    return 0;
  }
}