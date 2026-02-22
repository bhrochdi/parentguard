import { type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import "@/index.css";

interface Props { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode; }

const NAV = [
  { path: "/dashboard", icon: "📊", label: "Tableau de bord" },
  { path: "/temps",     icon: "⏰", label: "Temps d'écran" },
  { path: "/sites",     icon: "🌐", label: "Sites web" },
  { path: "/apps",      icon: "🎮", label: "Applications" },
  { path: "/rapports",  icon: "📋", label: "Rapports" },
  { path: "/profils",   icon: "👤", label: "Profils enfants" },
  { path: "/parametres",icon: "⚙️", label: "Paramètres" },
];

export default function Layout({ title, subtitle, actions, children }: Props) {
  const { profils, profilActif, setProfilActif, logout, goKid } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🛡️</div>
          <div>
            <div className="logo-name">ParentGuard</div>
            <div className="logo-sub">Contrôle parental</div>
          </div>
        </div>

        {/* Sélecteur profil */}
        {profils.length > 0 && (
          <div className="profil-selector">
            <label>Profil surveillé</label>
            <select
              value={profilActif?.id ?? ""}
              onChange={(e) => {
                const p = profils.find((x) => x.id === e.target.value);
                if (p) setProfilActif(p);
              }}
            >
              {profils.map((p) => (
                <option key={p.id} value={p.id}>{p.avatar_emoji} {p.prenom}</option>
              ))}
            </select>
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="nav-group">
            <span className="nav-label">Surveillance</span>
            {NAV.slice(0, 5).map((n) => (
              <div key={n.path} className={`nav-item ${pathname === n.path ? "active" : ""}`}
                onClick={() => navigate(n.path)}>
                <span className="ni">{n.icon}</span> {n.label}
              </div>
            ))}
          </div>
          <div className="nav-group">
            <span className="nav-label">Configuration</span>
            {NAV.slice(5).map((n) => (
              <div key={n.path} className={`nav-item ${pathname === n.path ? "active" : ""}`}
                onClick={() => navigate(n.path)}>
                <span className="ni">{n.icon}</span> {n.label}
              </div>
            ))}
          </div>

          {/* Mode enfant */}
          {profilActif && (
            <div style={{ marginTop: 8 }}>
              <div className="nav-label">Session enfant</div>
              <div className="nav-item" style={{ background: "#1D4ED8", color: "white" }}
                onClick={() => goKid(profilActif)}>
                <span className="ni">🧒</span> Passer en mode enfant
              </div>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">A</div>
            <span>Administrateur</span>
          </div>
          <button className="logout-btn" onClick={logout} title="Déconnexion">🚪</button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-area">
        <div className="topbar">
          <div>
            <div className="page-title">{title}</div>
            {subtitle && <div className="page-sub">{subtitle}</div>}
          </div>
          {actions && <div className="tb-actions">{actions}</div>}
        </div>
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}
