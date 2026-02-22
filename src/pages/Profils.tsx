import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { ProfilStore } from "@/lib/store";
import type { Profil } from "@/lib/types";

const EMOJIS  = ["🧒","👦","👧","🧒‍♂️","🧒‍♀️","😊","🌟","🚀","🦁","🐯"];
const COLORS  = ["#6366F1","#EF4444","#10B981","#F59E0B","#3B82F6","#8B5CF6","#EC4899","#14B8A6"];

function ProfilModal({ profil, onClose, onSaved }: { profil?: Profil; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!profil;
  const [form, setForm] = useState({
    prenom:                    profil?.prenom ?? "",
    avatar_emoji:              profil?.avatar_emoji ?? "🧒",
    avatar_color:              profil?.avatar_color ?? "#6366F1",
    actif:                     profil?.actif ?? true,
    limite_quotidienne_minutes: profil?.limite_quotidienne_minutes ?? 120,
    mode_sites:                profil?.mode_sites ?? "blacklist" as "blacklist" | "whitelist",
  });

  const handleSave = () => {
    if (!form.prenom.trim()) return;
    const data = {
      prenom:                    form.prenom.trim(),
      avatar_emoji:              form.avatar_emoji,
      avatar_color:              form.avatar_color,
      actif:                     form.actif,
      limite_quotidienne_minutes: form.limite_quotidienne_minutes,
      mode_sites:                form.mode_sites,
      plages_autorisees:         profil?.plages_autorisees ?? [],
      sites_bloques:             profil?.sites_bloques ?? [],
      sites_autorises:           profil?.sites_autorises ?? [],
      apps_bloquees:             profil?.apps_bloquees ?? [],
    };
    if (isEdit) ProfilStore.update(profil!.id, data);
    else        ProfilStore.create(data);
    onSaved();
    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <div className="modal-t">{isEdit ? "Modifier le profil" : "Nouveau profil enfant"}</div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-b">
          {/* Avatar */}
          <div className="field">
            <label>Avatar</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {EMOJIS.map((e) => (
                <div key={e} onClick={() => setForm((f) => ({ ...f, avatar_emoji: e }))} style={{
                  width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 20, cursor: "pointer",
                  background: form.avatar_emoji === e ? form.avatar_color : "#F3F4F6",
                  border: form.avatar_emoji === e ? `2px solid ${form.avatar_color}` : "2px solid transparent",
                }}>{e}</div>
              ))}
            </div>
          </div>

          {/* Couleur */}
          <div className="field">
            <label>Couleur</label>
            <div style={{ display: "flex", gap: 8 }}>
              {COLORS.map((c) => (
                <div key={c} onClick={() => setForm((f) => ({ ...f, avatar_color: c }))} style={{
                  width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer",
                  border: form.avatar_color === c ? "3px solid #111827" : "3px solid transparent",
                }} />
              ))}
            </div>
          </div>

          <div className="field">
            <label>Prénom *</label>
            <input value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
              placeholder="Prénom de l'enfant" />
          </div>

          <div className="field">
            <label>Limite quotidienne</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="range" min={0} max={480} step={15} value={form.limite_quotidienne_minutes}
                onChange={(e) => setForm((f) => ({ ...f, limite_quotidienne_minutes: Number(e.target.value) }))}
                style={{ flex: 1, accentColor: form.avatar_color }} />
              <span style={{ fontSize: 13, fontWeight: 600, minWidth: 60 }}>
                {form.limite_quotidienne_minutes === 0 ? "Illimité" : `${form.limite_quotidienne_minutes} min`}
              </span>
            </div>
          </div>

          <div className="field">
            <label>Mode de filtrage des sites</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { val: "blacklist", label: "🚫 Liste noire", sub: "Tout autorisé sauf les sites bloqués" },
                { val: "whitelist", label: "✅ Liste blanche", sub: "Tout bloqué sauf les sites autorisés" },
              ].map((m) => (
                <div key={m.val} onClick={() => setForm((f) => ({ ...f, mode_sites: m.val as "blacklist" | "whitelist" }))}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                    border: form.mode_sites === m.val ? `2px solid ${form.avatar_color}` : "2px solid #E5E7EB",
                    background: form.mode_sites === m.val ? "#F5F3FF" : "white",
                  }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-f">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave}
            style={{ background: form.avatar_color }}>
            {isEdit ? "Sauvegarder" : "Créer le profil →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilsPage() {
  const { profils, refreshProfils, setProfilActif } = useAuth();
  const [modal, setModal] = useState<"new" | Profil | null>(null);

  const handleDelete = (p: Profil) => {
    if (!confirm(`Supprimer le profil de ${p.prenom} ? Toutes ses données seront perdues.`)) return;
    ProfilStore.delete(p.id);
    refreshProfils();
  };

  return (
    <Layout
      title="Profils enfants"
      subtitle={`${profils.length} profil${profils.length > 1 ? "s" : ""} configuré${profils.length > 1 ? "s" : ""}`}
      actions={<button className="btn btn-primary" onClick={() => setModal("new")}>+ Nouveau profil</button>}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {profils.map((p) => (
          <div key={p.id} className="card" style={{ padding: 20 }}>
            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 54, height: 54, borderRadius: "50%", background: p.avatar_color,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0,
              }}>{p.avatar_emoji}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{p.prenom}</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  {p.limite_quotidienne_minutes === 0 ? "Illimité" : `${p.limite_quotidienne_minutes}min/jour`}
                </div>
              </div>
            </div>

            {/* Infos */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {[
                { label: "Mode sites", val: p.mode_sites === "blacklist" ? "🚫 Liste noire" : "✅ Liste blanche" },
                { label: "Plages horaires", val: `${p.plages_autorisees?.length ?? 0} configurée(s)` },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: "#6B7280" }}>{r.label}</span>
                  <span style={{ fontWeight: 500 }}>{r.val}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }}
                onClick={() => { setProfilActif(p); setModal(p); }}>
                ✏️ Modifier
              </button>
              <button className="btn btn-sm" style={{ background: p.avatar_color, color: "white", border: "none" }}
                onClick={() => setProfilActif(p)}>
                Activer
              </button>
              <button className="btn-icon" onClick={() => handleDelete(p)}>🗑</button>
            </div>
          </div>
        ))}

        {profils.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>👤</div>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, marginBottom: 8 }}>Aucun profil créé</div>
            <div style={{ color: "#6B7280", fontSize: 14, marginBottom: 20 }}>
              Créez un profil pour chaque enfant à surveiller
            </div>
            <button className="btn btn-primary" onClick={() => setModal("new")}>+ Créer le premier profil</button>
          </div>
        )}
      </div>

      {modal && (
        <ProfilModal
          profil={modal === "new" ? undefined : modal}
          onClose={() => setModal(null)}
          onSaved={refreshProfils}
        />
      )}
    </Layout>
  );
}
