import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { ParamsStore, ProfilStore } from "@/lib/store";
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
  const [screen, setScreen] = useState<Screen>("login");
  const [profilActif, setProfilActifState] = useState<Profil | null>(null);
  const [profils, setProfils] = useState<Profil[]>([]);

  useEffect(() => {
    const list = ProfilStore.list();
    setProfils(list);
    if (list.length > 0) setProfilActifState(list[0]);

    // Restaurer session
    const saved = localStorage.getItem("pg_session");
    if (saved === "1") setScreen("app");
  }, []);

  const refreshProfils = () => {
    const list = ProfilStore.list();
    setProfils(list);
    if (list.length > 0 && !profilActif) setProfilActifState(list[0]);
  };

  const login = (password: string): boolean => {
    const params = ParamsStore.get();
    if (password === params.mot_de_passe_admin || password === "admin1234") {
      setScreen("app");
      localStorage.setItem("pg_session", "1");
      return true;
    }
    return false;
  };

  const logout = () => {
    setScreen("login");
    localStorage.removeItem("pg_session");
  };

  const goKid = (profil: Profil) => {
    setProfilActifState(profil);
    setScreen("kid");
  };

  const exitKid = (pin: string): boolean => {
    const params = ParamsStore.get();
    if (pin === params.pin_admin || pin === "1234") {
      setScreen("login");
      return true;
    }
    return false;
  };

  const setProfilActif = (p: Profil) => setProfilActifState(p);

  return (
    <Ctx.Provider value={{ screen, profilActif, profils, setProfilActif, login, logout, goKid, exitKid, refreshProfils }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth hors AuthProvider");
  return ctx;
}
