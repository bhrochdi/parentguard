import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { StatsStore, LogStore, ProfilStore } from "@/lib/store";
import type { LogActivite, StatsJour } from "@/lib/types";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function DashboardPage() {
  const { profilActif, profils } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsJour | null>(null);
  const [week, setWeek]   = useState<StatsJour[]>([]);
  const [logs, setLogs]   = useState<LogActivite[]>([]);

  useEffect(() => {
    if (!profilActif) return;
    setStats(StatsStore.today(profilActif.id));
    setWeek(StatsStore.week(profilActif.id));
    setLogs(LogStore.list(profilActif.id, 8));
  }, [profilActif]);

  const limite = profilActif?.limite_quotidienne_minutes ?? 0;
  const utilise = stats?.minutes_utilisees ?? 0;
  const pct = limite > 0 ? Math.min(100, Math.round((utilise / limite) * 100)) : 0;

  const LOG_ICONS: Record<string, string> = {
    connexion:       "🟢",
    site_bloque:     "🚫",
    app_bloquee:     "🎮",
    limite_atteinte: "⏰",
    hors_plage:      "🌙",
  };

  const weekData = week.map((s) => ({
    jour: format(new Date(s.date), "EEE", { locale: fr }),
    minutes: s.minutes_utilisees,
    bloques: s.sites_bloques_count,
  }));

  return (
    <Layout
      title="Tableau de bord"
      subtitle={profilActif ? `Profil actif : ${profilActif.avatar_emoji} ${profilActif.prenom}` : "Aucun profil sélectionné"}
      actions={
        profils.length === 0
          ? <button className="btn btn-primary" onClick={() => navigate("/profils")}>+ Créer un profil enfant</button>
          : <button className="btn btn-ghost btn-sm" onClick={() => navigate("/rapports")}>📋 Voir tous les rapports</button>
      }
    >
      {profils.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🛡️</div>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, marginBottom: 8 }}>
            Bienvenue sur ParentGuard
          </div>
          <p style={{ color: "#6B7280", marginBottom: 24, fontSize: 14 }}>
            Commencez par créer un profil pour votre enfant
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/profils")}>
            + Créer le premier profil enfant
          </button>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="stats-grid">
            {[
              { label: "Temps utilisé", value: `${utilise}min`, icon: "⏱️", bg: "#EEF2FF", accent: "#6366F1",
                sub: limite > 0 ? `/${limite}min autorisées` : "illimité" },
              { label: "Sites bloqués", value: stats?.sites_bloques_count ?? 0, icon: "🚫", bg: "#FEE2E2", accent: "#EF4444",
                sub: "aujourd'hui" },
              { label: "Apps bloquées", value: stats?.apps_bloquees_count ?? 0, icon: "🎮", bg: "#FEF3C7", accent: "#F59E0B",
                sub: "aujourd'hui" },
              { label: "Statut internet", value: "Actif", icon: "🌐", bg: "#D1FAE5", accent: "#10B981",
                sub: "connexion normale" },
            ].map((s) => (
              <div key={s.label} className="stat-card" style={{ background: s.bg }}>
                <div className="si">{s.icon}</div>
                <div className="sv">{s.value}</div>
                <div className="sl" style={{ color: s.accent }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Barre de progression temps */}
          {limite > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>⏰ Temps d'écran aujourd'hui</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#10B981" }}>
                    {pct}%
                  </span>
                </div>
                <div style={{ height: 10, background: "#F3F4F6", borderRadius: 999 }}>
                  <div style={{
                    height: "100%", borderRadius: 999, transition: "width 0.6s ease",
                    width: `${pct}%`,
                    background: pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#6366F1",
                  }} />
                </div>
                <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 6 }}>
                  {utilise} min utilisées sur {limite} min autorisées
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
            {/* Graphique semaine */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Temps d'écran — 7 derniers jours</div>
                  <div className="card-sub">Minutes par jour</div>
                </div>
              </div>
              <div className="card-body" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData} barSize={20}>
                    <XAxis dataKey="jour" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: number) => [`${v} min`, "Temps d'écran"]}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="minutes" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Logs récents */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Activité récente</div>
              </div>
              <div className="card-body" style={{ padding: "8px 16px" }}>
                {logs.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#9CA3AF", padding: "24px 0", fontSize: 13 }}>
                    Aucune activité enregistrée
                  </div>
                ) : logs.map((l, i) => (
                  <div key={l.id} style={{
                    display: "flex", gap: 10, padding: "9px 0",
                    borderBottom: i < logs.length - 1 ? "1px solid #F3F4F6" : "none",
                  }}>
                    <span style={{ fontSize: 14 }}>{LOG_ICONS[l.type] ?? "📌"}</span>
                    <div>
                      <div style={{ fontSize: 12.5 }}>{l.detail}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
                        {format(new Date(l.timestamp), "HH:mm", { locale: fr })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
