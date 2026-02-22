import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfilStore } from "@/lib/store";

// ── Écran sélection enfant ────────────────────────────
export function ChoixProfilScreen() {
  const { profils, goKid, logout } = useAuth();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(160deg, #1E1B4B 0%, #111827 100%)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>👋</div>
        <h1 style={{ fontFamily: "'Nunito',sans-serif", color: "white", fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          Qui utilise l'ordinateur ?
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Sélectionne ton prénom</p>
      </div>

      <div style={{ background: "#F5F2EE", borderRadius: "24px 24px 0 0", padding: "28px 32px 40px", animation: "slideUp 0.3s ease" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 380, margin: "0 auto" }}>
          {profils.map((p) => (
            <button key={p.id} onClick={() => goKid(p)} style={{
              display: "flex", alignItems: "center", gap: 16, padding: "14px 18px",
              background: "white", border: `2px solid transparent`, borderRadius: 14,
              cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", transition: "all 0.15s",
              fontFamily: "'DM Sans',sans-serif",
            }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = p.avatar_color)}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = "transparent")}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: p.avatar_color,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                {p.avatar_emoji}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 18, fontWeight: 800 }}>{p.prenom}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                  {p.limite_quotidienne_minutes === 0 ? "Pas de limite" : `${p.limite_quotidienne_minutes}min/jour`}
                </div>
              </div>
              <span style={{ marginLeft: "auto", color: "#D1D5DB", fontSize: 20 }}>›</span>
            </button>
          ))}

          {profils.length === 0 && (
            <div style={{ textAlign: "center", color: "#9CA3AF", padding: 24 }}>
              Aucun profil configuré par le parent.
            </div>
          )}

          <button onClick={logout} style={{ marginTop: 8, padding: 11, background: "transparent",
            border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 13, color: "#6B7280",
            cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            ← Mode parent
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Interface mode enfant ─────────────────────────────
export function KidScreen() {
  const { profilActif, exitKid } = useAuth();
  const [showPin, setShowPin]   = useState(false);
  const [pin, setPin]           = useState("");
  const [pinErr, setPinErr]     = useState(false);
  const [shake, setShake]       = useState(false);

  const profil = profilActif ?? ProfilStore.list()[0];
  if (!profil) return null;

  const handlePinDigit = (d: string) => {
    if (d === "⌫") { setPin((p) => p.slice(0, -1)); return; }
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      const ok = exitKid(next);
      if (!ok) {
        setPinErr(true); setShake(true);
        setTimeout(() => { setShake(false); setPin(""); setPinErr(false); }, 700);
      }
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes shake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
      `}</style>
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#F5F2EE", fontFamily: "'DM Sans',sans-serif" }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${profil.avatar_color}, ${profil.avatar_color}CC)`,
          padding: "16px 24px 20px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                {profil.avatar_emoji}
              </div>
              <div>
                <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 18, fontWeight: 800, color: "white" }}>
                  Bonjour {profil.prenom} ! 👋
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
                  {profil.limite_quotidienne_minutes === 0
                    ? "Pas de limite aujourd'hui"
                    : `Limite : ${profil.limite_quotidienne_minutes} min/jour`}
                </div>
              </div>
            </div>
            <button onClick={() => setShowPin(true)} style={{
              background: "rgba(255,255,255,0.2)", border: "none", color: "white",
              borderRadius: 10, padding: "7px 12px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              🔒 Parent
            </button>
          </div>

          {/* Règles actives */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { val: `${profil.plages_autorisees?.length ?? 0} plage(s)`, label: "📅 Horaires" },
              { val: profil.mode_sites === "whitelist" ? "Strict" : "Normal", label: "🌐 Sites" },
            ].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "8px 12px" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "white", fontFamily: "'Nunito',sans-serif" }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 16, fontWeight: 800, marginBottom: 14 }}>
            Mes règles
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                icon: "⏰",
                title: "Temps d'écran",
                desc: profil.limite_quotidienne_minutes === 0
                  ? "Pas de limite aujourd'hui"
                  : `Maximum ${profil.limite_quotidienne_minutes} minutes par jour`,
                color: "#6366F1", bg: "#EEF2FF",
              },
              {
                icon: "🌐",
                title: "Sites web",
                desc: profil.mode_sites === "whitelist"
                  ? "Seulement les sites autorisés par tes parents"
                  : "Certains sites sont bloqués",
                color: "#EF4444", bg: "#FEE2E2",
              },
              {
                icon: "📅",
                title: "Horaires",
                desc: profil.plages_autorisees?.length
                  ? `Internet disponible selon les plages configurées`
                  : "Pas de restriction horaire",
                color: "#10B981", bg: "#D1FAE5",
              },
            ].map((r) => (
              <div key={r.title} style={{ background: r.bg, borderRadius: 14, padding: "14px 16px",
                display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 28 }}>{r.icon}</span>
                <div>
                  <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 14, fontWeight: 800, color: r.color }}>{r.title}</div>
                  <div style={{ fontSize: 12.5, color: "#374151", marginTop: 2 }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "#DBEAFE", borderRadius: 14, padding: "12px 16px",
            display: "flex", gap: 10, alignItems: "center", marginTop: 14 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div style={{ fontSize: 12, color: "#1E40AF", lineHeight: 1.5 }}>
              <b>Ces règles sont définies par tes parents.</b><br />
              Si tu as une question, demande-leur !
            </div>
          </div>
        </div>

        {/* Modal PIN */}
        {showPin && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            zIndex: 200, backdropFilter: "blur(4px)" }}
            onClick={() => { setShowPin(false); setPin(""); }}>
            <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%",
              maxWidth: 420, padding: "28px 28px 40px", animation: "slideUp 0.25s ease" }}
              onClick={(e) => e.stopPropagation()}>

              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <div style={{ fontSize: 38, marginBottom: 8 }}>🔐</div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22 }}>Code parent</div>
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Entrez le PIN à 4 chiffres</div>
              </div>

              {/* Indicateurs PIN */}
              <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 22,
                animation: shake ? "shake 0.5s ease" : "none" }}>
                {[0,1,2,3].map((i) => (
                  <div key={i} style={{
                    width: 14, height: 14, borderRadius: "50%",
                    background: i < pin.length ? (pinErr ? "#EF4444" : profil.avatar_color) : "#E5E7EB",
                    transition: "background 0.15s",
                  }} />
                ))}
              </div>
              {pinErr && <div style={{ textAlign: "center", color: "#EF4444", fontSize: 12.5, marginBottom: 10 }}>Code incorrect</div>}

              {/* Pavé */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, maxWidth: 260, margin: "0 auto" }}>
                {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k, i) => (
                  <button key={i} onClick={() => k !== "" && handlePinDigit(String(k))} style={{
                    height: 56, borderRadius: 12, border: "1.5px solid #E5E7EB",
                    fontSize: k === "⌫" ? 18 : 22, fontWeight: 600, cursor: k === "" ? "default" : "pointer",
                    background: k === "" ? "transparent" : "#F9FAFB", color: k === "" ? "transparent" : "#111827",
                    opacity: k === "" ? 0 : 1, fontFamily: "'DM Sans',sans-serif",
                  }}>{k}</button>
                ))}
              </div>

              <button onClick={() => { setShowPin(false); setPin(""); }} style={{
                width: "100%", marginTop: 14, padding: 11, background: "transparent",
                border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 13,
                color: "#6B7280", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
