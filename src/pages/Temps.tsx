import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { ProfilStore } from "@/lib/store";
import type { PlageHoraire } from "@/lib/types";

const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function TempsPage() {
  const { profilActif, refreshProfils } = useAuth();
  const [limite, setLimite]   = useState(120);
  const [plages, setPlages]   = useState<PlageHoraire[]>([]);
  const [saved, setSaved]     = useState(false);
  const [showPlage, setShowPlage] = useState(false);
  const [newPlage, setNewPlage] = useState({ label: "", debut: "08:00", fin: "20:00", jours: [1,2,3,4,5] as number[] });

  useEffect(() => {
    if (profilActif) {
      setLimite(profilActif.limite_quotidienne_minutes);
      setPlages(profilActif.plages_autorisees ?? []);
    }
  }, [profilActif]);

  const handleSave = () => {
    if (!profilActif) return;
    ProfilStore.update(profilActif.id, {
      limite_quotidienne_minutes: limite,
      plages_autorisees: plages,
    });
    refreshProfils();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleJour = (j: number) => {
    setNewPlage((p) => ({
      ...p,
      jours: p.jours.includes(j) ? p.jours.filter((x) => x !== j) : [...p.jours, j],
    }));
  };

  const addPlage = () => {
    const plage: PlageHoraire = {
      id: Date.now().toString(),
      label: newPlage.label || `${newPlage.debut}–${newPlage.fin}`,
      debut: newPlage.debut,
      fin: newPlage.fin,
      jours: newPlage.jours,
      actif: true,
    };
    setPlages((p) => [...p, plage]);
    setShowPlage(false);
    setNewPlage({ label: "", debut: "08:00", fin: "20:00", jours: [1,2,3,4,5] });
  };

  const togglePlage = (id: string) => {
    setPlages((p) => p.map((x) => x.id === id ? { ...x, actif: !x.actif } : x));
  };

  const deletePlage = (id: string) => {
    setPlages((p) => p.filter((x) => x.id !== id));
  };

  return (
    <Layout
      title="Temps d'écran"
      subtitle={`Limites pour ${profilActif?.prenom ?? "..."}`}
      actions={
        <button className="btn btn-primary" onClick={handleSave}
          style={{ background: saved ? "#10B981" : undefined, transition: "background 0.3s" }}>
          {saved ? "✅ Sauvegardé !" : "Sauvegarder"}
        </button>
      }
    >
      {!profilActif ? (
        <div style={{ textAlign: "center", paddingTop: 60, color: "#9CA3AF" }}>Sélectionnez un profil</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 860 }}>

          {/* Limite quotidienne */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">⏰ Limite quotidienne</div>
                <div className="card-sub">Durée totale autorisée par jour</div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 48, color: "#6366F1" }}>
                  {limite === 0 ? "∞" : `${Math.floor(limite / 60)}h${limite % 60 > 0 ? `${limite % 60}m` : ""}`}
                </div>
                <div style={{ fontSize: 13, color: "#9CA3AF" }}>
                  {limite === 0 ? "Aucune limite" : `${limite} minutes par jour`}
                </div>
              </div>

              <input type="range" min={0} max={480} step={15} value={limite}
                onChange={(e) => setLimite(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#6366F1" }} />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                <span>Illimité</span>
                <span>1h</span>
                <span>2h</span>
                <span>4h</span>
                <span>8h</span>
              </div>

              {/* Presets rapides */}
              <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                {[0, 30, 60, 90, 120, 180].map((v) => (
                  <button key={v} className={`btn btn-sm ${limite === v ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setLimite(v)}>
                    {v === 0 ? "Illimité" : v < 60 ? `${v}min` : `${v / 60}h`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">ℹ️ Comment ça fonctionne</div>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: "⏰", title: "Limite quotidienne", desc: "L'enfant peut utiliser le PC jusqu'à la limite. Au-delà, la session est coupée." },
                  { icon: "📅", title: "Plages horaires", desc: "Internet n'est disponible que pendant les créneaux autorisés. En dehors, connexion coupée." },
                  { icon: "🔔", title: "Alertes", desc: "Un avertissement s'affiche à 15min et 5min de la limite." },
                  { icon: "🔒", title: "Sécurité", desc: "Seul le mot de passe parent permet de modifier ces règles." },
                ].map((f) => (
                  <div key={f.title} style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{f.title}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Plages horaires */}
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="card-header">
              <div>
                <div className="card-title">📅 Plages horaires autorisées</div>
                <div className="card-sub">Internet accessible uniquement pendant ces créneaux</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowPlage(true)}>
                + Ajouter une plage
              </button>
            </div>
            <div className="card-body">
              {plages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#9CA3AF" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                  Aucune restriction horaire — internet disponible 24h/24
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {plages.map((p) => (
                    <div key={p.id} style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                      background: "#F9FAFB", borderRadius: 10,
                      border: p.actif ? "1.5px solid #6366F1" : "1.5px solid #E5E7EB",
                      opacity: p.actif ? 1 : 0.55,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                          {p.label || `${p.debut} – ${p.fin}`}
                        </div>
                        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                          {p.debut} – {p.fin} &nbsp;·&nbsp;
                          {p.jours.sort().map((j) => JOURS[j]).join(", ")}
                        </div>
                      </div>
                      <div className={`toggle ${p.actif ? "toggle-on" : "toggle-off"}`}
                        onClick={() => togglePlage(p.id)}>
                        <div className="toggle-thumb" style={{ left: p.actif ? 23 : 3 }} />
                      </div>
                      <button className="btn-icon" onClick={() => deletePlage(p.id)}>🗑</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal plage horaire */}
      {showPlage && (
        <div className="modal-bg" onClick={() => setShowPlage(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-h">
              <div className="modal-t">Nouvelle plage horaire</div>
              <button className="btn-icon" onClick={() => setShowPlage(false)}>✕</button>
            </div>
            <div className="modal-b">
              <div className="field">
                <label>Label (optionnel)</label>
                <input value={newPlage.label} onChange={(e) => setNewPlage((p) => ({ ...p, label: e.target.value }))}
                  placeholder="ex: Après école, Week-end…" />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Début</label>
                  <input type="time" value={newPlage.debut} onChange={(e) => setNewPlage((p) => ({ ...p, debut: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Fin</label>
                  <input type="time" value={newPlage.fin} onChange={(e) => setNewPlage((p) => ({ ...p, fin: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Jours</label>
                <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                  {JOURS.map((j, i) => (
                    <div key={j} onClick={() => toggleJour(i)} style={{
                      width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center",
                      justifyContent: "center", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: newPlage.jours.includes(i) ? "#6366F1" : "#F3F4F6",
                      color: newPlage.jours.includes(i) ? "white" : "#6B7280",
                    }}>{j}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-f">
              <button className="btn btn-ghost" onClick={() => setShowPlage(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={addPlage}>Ajouter la plage →</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
