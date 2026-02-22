import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [pw, setPw]         = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError]   = useState(false);
  const [shake, setShake]   = useState(false);

  const handleLogin = () => {
    const ok = login(pw);
    if (!ok) { setError(true); setShake(true); setTimeout(() => setShake(false), 500); }
  };

  return (
    <div className="login-shell">
      {/* Gauche */}
      <div className="login-left">
        <div style={{ fontSize: 56, marginBottom: 8 }}>🛡️</div>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", color: "white", fontSize: 30, textAlign: "center" }}>
          ParentGuard
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
          Contrôle parental complet pour protéger vos enfants sur PC et Mac.
        </p>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 260 }}>
          {[
            { icon: "🌐", text: "Blocage de sites web" },
            { icon: "⏰", text: "Limite de temps d'écran" },
            { icon: "🎮", text: "Blocage d'applications" },
            { icon: "📅", text: "Plages horaires internet" },
            { icon: "📊", text: "Rapports d'activité" },
          ].map((f) => (
            <div key={f.text} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span>{f.icon}</span>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Droite */}
      <div className="login-right">
        <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, marginBottom: 6 }}>Connexion parent</h2>
        <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 32 }}>Entrez votre mot de passe administrateur</p>

        <div style={{ animation: shake ? "shake 0.4s ease" : "none" }}>
          <div className="field" style={{ marginBottom: 20 }}>
            <label>Mot de passe</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>🔑</span>
              <input
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                style={{ width: "100%", paddingLeft: 38, paddingRight: 38, borderColor: error ? "#EF4444" : undefined }}
              />
              <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", opacity: 0.5 }}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: "#FEE2E2", color: "#7F1D1D", padding: "9px 14px", borderRadius: 8, fontSize: 12.5, marginBottom: 16, display: "flex", gap: 8 }}>
            ⚠️ Mot de passe incorrect
          </div>
        )}

        <button className="btn btn-primary" onClick={handleLogin}
          style={{ width: "100%", justifyContent: "center", padding: 12, fontSize: 14 }}>
          Accéder au tableau de bord →
        </button>

        <div style={{ marginTop: 20, background: "#EEF2FF", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#3730A3", marginBottom: 3 }}>🧪 Mot de passe par défaut</div>
          <div style={{ fontSize: 12, color: "#4338CA" }}><b>admin1234</b> — modifiable dans les Paramètres</div>
        </div>
      </div>
    </div>
  );
}
