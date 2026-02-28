import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { SiteStore, LogStore } from "@/lib/store";

// Commandes système directes
async function blockSite(domaine: string) {
  try { const { invoke } = await import("@tauri-apps/api/core"); await invoke("block_site", { domaine }); } catch {}
}
async function unblockSite(domaine: string) {
  try { const { invoke } = await import("@tauri-apps/api/core"); await invoke("unblock_site", { domaine }); } catch {}
}
import type { CategoreSite, Site } from "@/lib/types";

const CATEGORIES: Record<CategoreSite, { label: string; emoji: string }> = {
  reseaux_sociaux: { label: "Réseaux sociaux", emoji: "📱" },
  jeux:            { label: "Jeux en ligne",    emoji: "🎮" },
  streaming:       { label: "Streaming vidéo",  emoji: "🎬" },
  adulte:          { label: "Contenu adulte",   emoji: "🔞" },
  autre:           { label: "Autre",            emoji: "🌐" },
};

const PRESETS: Array<{ domaine: string; cat: CategoreSite }> = [
  { domaine: "tiktok.com",    cat: "reseaux_sociaux" },
  { domaine: "instagram.com", cat: "reseaux_sociaux" },
  { domaine: "facebook.com",  cat: "reseaux_sociaux" },
  { domaine: "snapchat.com",  cat: "reseaux_sociaux" },
  { domaine: "youtube.com",   cat: "streaming" },
  { domaine: "twitch.tv",     cat: "streaming" },
  { domaine: "roblox.com",    cat: "jeux" },
  { domaine: "fortnite.com",  cat: "jeux" },
];

export default function SitesPage() {
  const { profilActif } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ domaine: "", categorie: "autre" as CategoreSite });
  const [filtre, setFiltre] = useState<"all" | CategoreSite>("all");

  const load = () => {
    if (profilActif) setSites(SiteStore.list(profilActif.id));
  };

  useEffect(() => { load(); }, [profilActif]);

  const handleAdd = async () => {
    if (!profilActif || !form.domaine.trim()) return;
    const domaine = form.domaine.trim().replace(/^https?:\/\//, "").replace(/^www\./, "");
    SiteStore.add({ domaine, categorie: form.categorie, profil_id: profilActif.id, bloque: true });
    await blockSite(domaine);
    LogStore.add({ profil_id: profilActif.id, type: "site_bloque", detail: `Site bloqué : ${domaine}` });
    setForm({ domaine: "", categorie: "autre" });
    setShowModal(false);
    load();
  };

  const handleToggle = async (site: Site) => {
    SiteStore.toggle(site.id);
    if (site.bloque) {
      await unblockSite(site.domaine);
    } else {
      await blockSite(site.domaine);
    }
    load();
  };

  const handleDelete = async (site: Site) => {
    SiteStore.delete(site.id);
    await unblockSite(site.domaine);
    load();
  };

  const handlePreset = async (p: typeof PRESETS[0]) => {
    if (!profilActif) return;
    if (sites.find((s) => s.domaine === p.domaine)) return;
    SiteStore.add({ domaine: p.domaine, categorie: p.cat, profil_id: profilActif.id, bloque: true });
    await blockSite(p.domaine);
    load();
  };

  const filtered = filtre === "all" ? sites : sites.filter((s) => s.categorie === filtre);
  const bloques = sites.filter((s) => s.bloque).length;

  return (
    <Layout
      title="Sites web"
      subtitle={`${bloques} site${bloques > 1 ? "s" : ""} bloqué${bloques > 1 ? "s" : ""} pour ${profilActif?.prenom ?? "..."}`}
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Bloquer un site</button>
      }
    >
      {!profilActif ? (
        <div style={{ textAlign: "center", paddingTop: 60, color: "#9CA3AF" }}>Sélectionnez un profil dans la sidebar</div>
      ) : (
        <>
          {/* Presets rapides */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div>
                <div className="card-title">⚡ Blocages rapides</div>
                <div className="card-sub">Cliquez pour bloquer instantanément</div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PRESETS.map((p) => {
                  const already = !!sites.find((s) => s.domaine === p.domaine);
                  return (
                    <button key={p.domaine} onClick={() => handlePreset(p)}
                      className={`btn btn-sm ${already ? "btn-ghost" : "btn-primary"}`}
                      disabled={already}
                      style={{ opacity: already ? 0.5 : 1 }}>
                      {CATEGORIES[p.cat].emoji} {p.domaine}
                      {already && " ✓"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filtres par catégorie */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            <button className={`btn btn-sm ${filtre === "all" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setFiltre("all")}>Tous ({sites.length})</button>
            {Object.entries(CATEGORIES).map(([k, v]) => {
              const count = sites.filter((s) => s.categorie === k).length;
              if (count === 0) return null;
              return (
                <button key={k} className={`btn btn-sm ${filtre === k ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setFiltre(k as CategoreSite)}>
                  {v.emoji} {v.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Domaine</th>
                  <th>Catégorie</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>🌐 {s.domaine}</td>
                    <td>
                      <span style={{ fontSize: 12.5, color: "#6B7280" }}>
                        {CATEGORIES[s.categorie].emoji} {CATEGORIES[s.categorie].label}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${s.bloque ? "badge-off" : "badge-on"}`}>
                        {s.bloque ? "🚫 Bloqué" : "✅ Autorisé"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {/* Toggle */}
                        <div className={`toggle ${s.bloque ? "toggle-on" : "toggle-off"}`}
                          onClick={() => handleToggle(s)} style={{ width: 36, height: 20 }}>
                          <div className="toggle-thumb"
                            style={{ width: 14, height: 14, top: 3, left: s.bloque ? 19 : 3 }} />
                        </div>
                        <button className="btn-icon" onClick={() => handleDelete(s)} title="Supprimer">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>
                    Aucun site bloqué — utilisez les blocages rapides ci-dessus
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal ajout site */}
      {showModal && (
        <div className="modal-bg" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-h">
              <div className="modal-t">Bloquer un site</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-b">
              <div className="field">
                <label>Domaine *</label>
                <input value={form.domaine} onChange={(e) => setForm((f) => ({ ...f, domaine: e.target.value }))}
                  placeholder="ex: tiktok.com ou www.tiktok.com" />
              </div>
              <div className="field">
                <label>Catégorie</label>
                <select value={form.categorie} onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value as CategoreSite }))}>
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>{v.emoji} {v.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ background: "#FEF3C7", borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "#92400E" }}>
                💡 Le site sera bloqué via le fichier hosts système. L'app doit être lancée en administrateur.
              </div>
            </div>
            <div className="modal-f">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleAdd}>🚫 Bloquer ce site</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
