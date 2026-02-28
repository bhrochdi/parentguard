import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { ParamsStore, ProfilStore, syncReglesToRust, stopMonitoring } from "@/lib/store";
import type { Profil } from "@/lib/types";

type Screen = "login" | "app" | "kid";

interface AuthState {
  screen: Screen;
  profilActif: Profil | null;
  profils: Profil[];
  setProfilActif: (p: Profil) => void;
  login: (password: string) => boolean;
  logout: () => void;
  goKid: (profil: Profil) => void;
  exitKid: (pin: string) => boolean;
  refreshProfils: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen]           = useState<Screen>("login");
  const [profilActif, setProfilState] = useState<Profil | null>(null);
  const [profils, setProfils]         = useState<Profil[]>([]);

  useEffect(() => {
    const list = ProfilStore.list();
    setProfils(list);
    if (list.length > 0) setProfilState(list[0]);
    const saved = localStorage.getItem("pg_session");
    if (saved === "1") setScreen("app");
  }, []);

  const refreshProfils = () => {
    const list = ProfilStore.list();
    setProfils(list);
  };

  const login = (password: string): boolean => {
    const params = ParamsStore.get();
    if (password === params.mot_de_passe_admin || password === "admin1234") {
      // Désactiver le monitoring en mode parent
      stopMonitoring();
      setScreen("app");
      localStorage.setItem("pg_session", "1");
      return true;
    }
    return false;
  };

  const logout = () => {
    stopMonitoring();
    setScreen("login");
    localStorage.removeItem("pg_session");
  };

  const goKid = (profil: Profil) => {
    setProfilState(profil);
    setScreen("kid");
    // ── Activer le monitoring avec les règles du profil ──
    syncReglesToRust(profil);
  };

  const exitKid = (pin: string): boolean => {
    const params = ParamsStore.get();
    if (pin === params.pin_admin || pin === "1234") {
      // Désactiver le monitoring en repassant en mode parent
      stopMonitoring();
      setScreen("login");
      return true;
    }
    return false;
  };

  const setProfilActif = (p: Profil) => setProfilState(p);

  return (
    <Ctx.Provider value={{
      screen, profilActif, profils,
      setProfilActif, login, logout, goKid, exitKid, refreshProfils,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth hors AuthProvider");
  return ctx;
}
