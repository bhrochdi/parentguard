import { useState, useEffect } from "react";

export default function WelcomeDialog() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Afficher seulement au premier lancement
    const seen = localStorage.getItem("pg_welcome_seen");
    if (!seen) setVisible(true);
  }, []);

  const handleClose = () => {
    localStorage.setItem("pg_welcome_seen", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 999, backdropFilter: "blur(4px)", animation: "fadeIn 0.2s",
    }}>
      <div style={{
        background: "white", borderRadius: 18, width: 520,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
        animation: "slideUp 0.25s ease",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #6366F1, #4F46E5)",
          padding: "24px 26px 20px", textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🛡️</div>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 24, color: "white" }}>
            Bienvenue sur ParentGuard
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
            Première utilisation — lisez ces informations importantes
          </div>
        </div>

        {/* Contenu */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Windows */}
          <div style={{ background: "#EFF6FF", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>🪟</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>
                  Windows — Avertissement "Éditeur inconnu"
                </div>
                <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.6 }}>
                  Si Windows affiche <b>"Windows a protégé votre PC"</b>, cliquez sur{" "}
                  <b style={{ color: "#1D4ED8" }}>"Informations complémentaires"</b> puis{" "}
                  <b style={{ color: "#1D4ED8" }}>"Exécuter quand même"</b>.
                </div>
              </div>
            </div>
          </div>

          {/* macOS */}
          <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>🍎</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>
                  macOS — "Développeur non vérifié"
                </div>
                <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.6 }}>
                  Si macOS bloque l'application, faites{" "}
                  <b style={{ color: "#15803D" }}>clic droit → "Ouvrir"</b> au lieu
                  de double-cliquer, puis confirmez en cliquant sur <b style={{ color: "#15803D" }}>"Ouvrir"</b>.
                </div>
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div style={{ background: "#FEF3C7", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>🔒</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>
                  Pourquoi ce message ?
                </div>
                <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.6 }}>
                  Ce message apparaît car l'application n'a pas de <b>certificat commercial</b>{" "}
                  (~500€/an). Elle est <b>100% sûre</b> — aucune donnée n'est envoyée sur
                  internet, tout reste sur votre PC.
                </div>
              </div>
            </div>
          </div>

          {/* Admin */}
          <div style={{ background: "#FEE2E2", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚙️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 5 }}>
                  Lancer en administrateur (Windows)
                </div>
                <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.6 }}>
                  Pour que le blocage de sites fonctionne, faites{" "}
                  <b style={{ color: "#991B1B" }}>clic droit sur l'icône → "Exécuter en tant qu'administrateur"</b>.
                </div>
              </div>
            </div>
          </div>

          {/* Identifiants */}
          <div style={{
            background: "#F5F3FF", borderRadius: 12, padding: "12px 16px",
            display: "flex", justifyContent: "space-around",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Mot de passe
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#6366F1", fontFamily: "monospace" }}>
                admin1234
              </div>
            </div>
            <div style={{ width: 1, background: "#E5E7EB" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                PIN enfant
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#6366F1", fontFamily: "monospace" }}>
                1234
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "0 24px 22px" }}>
          <button onClick={handleClose} style={{
            width: "100%", padding: 13, background: "#6366F1", color: "white",
            border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
          }}>
            ✅ J'ai compris — Commencer
          </button>
          <div style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", marginTop: 10 }}>
            Ce message ne s'affichera plus au prochain lancement
          </div>
        </div>
      </div>
    </div>
  );
}
