import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { LogStore, StatsStore } from "@/lib/store";
import type { LogActivite, StatsJour } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const LOG_ICONS: Record<string, string> = {
  connexion:       "🟢",
  site_bloque:     "🚫",
  app_bloquee:     "🎮",
  limite_atteinte: "⏰",
  hors_plage:      "🌙",
};
const LOG_LABELS: Record<string, string> = {
  connexion:       "Connexion",
  site_bloque:     "Site bloqué",
  app_bloquee:     "App bloquée",
  limite_atteinte: "Limite atteinte",
  hors_plage:      "Hors plage",
};

export default function RapportsPage() {
  const { profilActif } = useAuth();
  const [logs, setLogs]     = useState<LogActivite[]>([]);
  const [week, setWeek]     = useState<StatsJour[]>([]);
  const [filtre, setFiltre] = useState<"all" | string>("all");

  useEffect(() => {
    if (!profilActif) return;
    setLogs(LogStore.list(profilActif.id, 100));
    setWeek(StatsStore.week(profilActif.id));
  }, [profilActif]);

  const filtered = filtre === "all" ? logs : logs.filter((l) => l.type === filtre);

  const weekData = week.map((s) => ({
    jour: format(new Date(s.date), "EEE d", { locale: fr }),
    "Temps (min)": s.minutes_utilisees,
    "Sites bloqués": s.sites_bloques_count,
  }));

  const totalMin = week.reduce((acc, s) => acc + s.minutes_utilisees, 0);
  const totalBlocs = week.reduce((acc, s) => acc + s.sites_bloques_count, 0);

  return (
    <Layout
      title="Rapports"
      subtitle={`Activité de ${profilActif?.prenom ?? "..."} — 7 derniers jours`}
    >
      {!profilActif ? (
        <div style={{ textAlign: "center", paddingTop: 60, color: "#9CA3AF" }}>Sélectionnez un profil</div>
      ) : (
        <>
          {/* Stats semaine */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
            {[
              { label: "Temps total (7j)", value: `${Math.floor(totalMin / 60)}h${totalMin % 60}m`, icon: "⏱️", bg: "#EEF2FF", color: "#6366F1" },
              { label: "Sites bloqués (7j)", value: totalBlocs, icon: "🚫", bg: "#FEE2E2", color: "#EF4444" },
              { label: "Événements", value: logs.length, icon: "📋", bg: "#D1FAE5", color: "#10B981" },
            ].map((s) => (
              <div key={s.label} className="stat-card" style={{ background: s.bg }}>
                <div className="si">{s.icon}</div>
                <div className="sv">{s.value}</div>
                <div className="sl" style={{ color: s.color }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 22 }}>
            {/* Graphique temps */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">⏱️ Temps d'écran par jour</div>
              </div>
              <div className="card-body" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData} barSize={18}>
                    <XAxis dataKey="jour" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="Temps (min)" fill="#6366F1" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graphique blocages */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">🚫 Sites bloqués par jour</div>
              </div>
              <div className="card-body" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekData}>
                    <XAxis dataKey="jour" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="Sites bloqués" stroke="#EF4444" strokeWidth={2} dot={{ r: 4, fill: "#EF4444" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Journal d'événements */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">📋 Journal d'événements</div>
                <div className="card-sub">{filtered.length} événements</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["all", "site_bloque", "app_bloquee", "limite_atteinte"].map((f) => (
                  <button key={f} className={`btn btn-sm ${filtre === f ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setFiltre(f)}>
                    {f === "all" ? "Tous" : LOG_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Heure</th>
                    <th>Type</th>
                    <th>Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id}>
                      <td style={{ color: "#9CA3AF", fontSize: 12, whiteSpace: "nowrap" }}>
                        {format(new Date(l.timestamp), "d MMM HH:mm", { locale: fr })}
                      </td>
                      <td>
                        <span style={{ fontSize: 12 }}>
                          {LOG_ICONS[l.type]} {LOG_LABELS[l.type] ?? l.type}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{l.detail}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={3} style={{ textAlign: "center", color: "#9CA3AF", padding: 32 }}>
                      Aucun événement enregistré
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
