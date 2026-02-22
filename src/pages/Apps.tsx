import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { AppStore, LogStore } from "@/lib/store";
import type { AppBloquee } from "@/lib/types";

const PRESETS = [
  { nom: "Fortnite",      executable: "FortniteClient-Win64-Shipping.exe", emoji: "🎮" },
  { nom: "Roblox",        executable: "RobloxPlayerBeta.exe",              emoji: "🎮" },
  { nom: "Minecraft",     executable: "Minecraft.exe",                     emoji: "⛏️" },
  { nom: "Steam",         executable: "steam.exe",                         emoji: "🎮" },
  { nom: "Discord",       executable: "Discord.exe",                       emoji: "💬" },
  { nom: "TikTok",        executable: "TikTok.exe",                        emoji: "📱" },
];

export default function AppsPage() {
  const { profilActif } = useAuth();
  const [apps, setApps]       = useState<AppBloquee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]       = useState({ nom: "", executable: "" });

  const load = () => {
    if (profilActif) setApps(AppStore.list(profilActif.id));
  };

  useEffect(() => { load(); }, [profilActif]);

  const handleAdd = () => {
    if (!profilActif || !form.nom || !form.executable) return;
    AppStore.add({ nom: form.nom, executable: form.executable, profil_id: profilActif.id, bloque: true });
    LogStore.add({ profil_id: profilActif.id, type: "app_bloquee", detail: `App bloquée : ${form.nom}` });
    setForm({ nom: "", executable: "" });
    setShowModal(false);
    load();
  };

  const handlePreset = (p: typeof PRESETS[0]) => {
    if (!profilActif || apps.find((a) => a.executable === p.executable)) return;
    AppStore.add({ nom: p.nom, executable: p.executable, profil_id: profilActif.id, bloque: true });
    load();
  };

  const bloquees = apps.filter((a) => a.bloque).length;

  return (
    <Layout
      title="Applications"
      subtitle={`${bloquees} app${bloquees > 1 ? "s" : ""} bloquée${bloquees > 1 ? "s" : ""} pour ${profilActif?.prenom ?? "..."}`}
      actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Bloquer une app</button>}
    >
      {!profilActif ? (
        <div style={{ textAlign: "center", paddingTop: 60, color: "#9CA3AF" }}>Sélectionnez un profil</div>
      ) : (
        <>
          {/* Presets rapides */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">⚡ Applications populaires</div>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PRESETS.map((p) => {
                  const already = !!apps.find((a) => a.executable === p.executable);
                  return (
                    <button key={p.executable} onClick={() => handlePreset(p)}
                      className={`btn btn-sm ${already ? "btn-ghost" : "btn-primary"}`}
                      disabled={already} style={{ opacity: already ? 0.5 : 1 }}>
                      {p.emoji} {p.nom} {already && "✓"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Liste */}
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Exécutable</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>🎮 {a.nom}</td>
                    <td><code style={{ fontSize: 12, color: "#6B7280", background: "#F3F4F6", padding: "2px 6px", borderRadius: 4 }}>{a.executable}</code></td>
                    <td><span className={`badge ${a.bloque ? "badge-off" : "badge-on"}`}>{a.bloque ? "🚫 Bloquée" : "✅ Autorisée"}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div className={`toggle ${a.bloque ? "toggle-on" : "toggle-off"}`}
                          onClick={() => { AppStore.toggle(a.id); load(); }}
                          style={{ width: 36, height: 20 }}>
                          <div className="toggle-thumb" style={{ width: 14, height: 14, top: 3, left: a.bloque ? 19 : 3 }} />
                        </div>
                        <button className="btn-icon" onClick={() => { AppStore.delete(a.id); load(); }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {apps.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>
                    Aucune application bloquée
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ background: "#FEF3C7", borderRadius: 10, padding: "12px 16px", marginTop: 16, fontSize: 12.5, color: "#92400E" }}>
            ⚠️ Le blocage d'applications nécessite que ParentGuard soit lancé en <b>administrateur Windows</b>. 
            Le processus sera automatiquement terminé s'il est détecté en cours d'exécution.
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-bg" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-h">
              <div className="modal-t">Bloquer une application</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-b">
              <div className="field">
                <label>Nom de l'application *</label>
                <input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="ex: Fortnite" />
              </div>
              <div className="field">
                <label>Nom de l'exécutable *</label>
                <input value={form.executable} onChange={(e) => setForm((f) => ({ ...f, executable: e.target.value }))} placeholder="ex: FortniteClient-Win64-Shipping.exe" />
              </div>
              <div style={{ background: "#EEF2FF", borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "#3730A3" }}>
                💡 Trouvez le nom de l'exécutable dans le Gestionnaire des tâches Windows (Ctrl+Shift+Échap)
              </div>
            </div>
            <div className="modal-f">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleAdd}>🚫 Bloquer cette app</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
