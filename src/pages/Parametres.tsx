import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { ParamsStore } from "@/lib/store";

export default function ParametresPage() {
  const [params, setParams] = useState(ParamsStore.get());
  const [mdp1, setMdp1]     = useState("");
  const [mdp2, setMdp2]     = useState("");
  const [pin1, setPin1]     = useState("");
  const [pin2, setPin2]     = useState("");
  const [saved, setSaved]   = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (mdp1 && mdp1 !== mdp2) errs.mdp = "Les mots de passe ne correspondent pas";
    if (mdp1 && mdp1.length < 6) errs.mdp = "Minimum 6 caractères";
    if (pin1 && pin1 !== pin2) errs.pin = "Les PIN ne correspondent pas";
    if (pin1 && !/^\d{4}$/.test(pin1)) errs.pin = "Le PIN doit être 4 chiffres";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const updated = { ...params };
    if (mdp1) updated.mot_de_passe_admin = mdp1;
    if (pin1) updated.pin_admin = pin1;
    ParamsStore.save(updated);
    setParams(updated);
    setMdp1(""); setMdp2(""); setPin1(""); setPin2("");
    setErrors({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Layout
      title="Paramètres"
      subtitle="Configuration de ParentGuard"
      actions={
        <button className="btn btn-primary" onClick={handleSave}
          style={{ background: saved ? "#10B981" : undefined, transition: "background 0.3s" }}>
          {saved ? "✅ Sauvegardé !" : "Sauvegarder"}
        </button>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 860 }}>

        {/* Mot de passe admin */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🔑 Mot de passe administrateur</div>
              <div className="card-sub">Requis pour accéder à l'interface parent</div>
            </div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label>Nouveau mot de passe</label>
              <input type="password" value={mdp1} onChange={(e) => setMdp1(e.target.value)}
                placeholder="Laisser vide pour ne pas changer"
                style={{ borderColor: errors.mdp ? "#EF4444" : undefined }} />
            </div>
            <div className="field">
              <label>Confirmer</label>
              <input type="password" value={mdp2} onChange={(e) => setMdp2(e.target.value)}
                placeholder="••••••••"
                style={{ borderColor: errors.mdp ? "#EF4444" : undefined }} />
            </div>
            {errors.mdp && <div style={{ color: "#EF4444", fontSize: 12 }}>⚠️ {errors.mdp}</div>}
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>
              Mot de passe actuel : {params.mot_de_passe_admin === "admin1234" ? "⚠️ Par défaut (changez-le !)" : "✅ Personnalisé"}
            </div>
          </div>
        </div>

        {/* PIN */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🔢 PIN de sortie mode enfant</div>
              <div className="card-sub">Code à 4 chiffres pour revenir au mode parent</div>
            </div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label>Nouveau PIN (4 chiffres)</label>
              <input type="password" inputMode="numeric" maxLength={4}
                value={pin1} onChange={(e) => setPin1(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                style={{ borderColor: errors.pin ? "#EF4444" : undefined }} />
            </div>
            <div className="field">
              <label>Confirmer le PIN</label>
              <input type="password" inputMode="numeric" maxLength={4}
                value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                style={{ borderColor: errors.pin ? "#EF4444" : undefined }} />
            </div>
            {errors.pin && <div style={{ color: "#EF4444", fontSize: 12 }}>⚠️ {errors.pin}</div>}
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>
              PIN actuel : {params.pin_admin === "1234" ? "⚠️ Par défaut (changez-le !)" : "✅ Personnalisé"}
            </div>
          </div>
        </div>

        {/* À propos */}
        <div className="card" style={{ gridColumn: "1/-1" }}>
          <div className="card-header"><div className="card-title">ℹ️ À propos de ParentGuard</div></div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              {[
                { label: "Version", val: "1.0.0" },
                { label: "Plateforme", val: "Windows / macOS" },
                { label: "Stockage", val: "100% local" },
                { label: "Internet requis", val: "Non" },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F3F4F6", paddingRight: 40 }}>
                  <span style={{ color: "#6B7280", fontSize: 13 }}>{r.label}</span>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{r.val}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, background: "#FEF3C7", borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: "#92400E" }}>
              ⚠️ <b>Important :</b> Pour que le blocage de sites et d'applications fonctionne, ParentGuard doit être
              lancé en tant qu'<b>administrateur Windows</b>. Faites un clic droit sur l'icône → "Exécuter en tant qu'administrateur".
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
