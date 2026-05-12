import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Users, AlertTriangle, Activity, TrendingUp, TrendingDown,
  RefreshCw, Clock, ChevronRight, Zap, Stethoscope,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { patients, alerts } from '../data/mockData';
import { useLang } from '../context/LanguageContext';

/* ─── Translations ──────────────────────────────────────────────────────────── */
const t = {
  FR: {
    title: 'Tableau de bord',
    subtitle: (n: number) => `Surveillance en temps réel — ${n} patients actifs`,
    updated: 'Mis à jour:',
    totalPatients: 'Patients totaux',
    underWatch: 'Sous surveillance active',
    activeAlerts: 'Alertes actives',
    needAttention: 'Nécessitent une attention',
    criticalCases: 'Cas critiques',
    avgAI: 'Score Moyen IA',
    atRisk: (n: number) => `${n} patients à risque`,
    trendTitle: 'Évolution des scores de risque IA — 7 jours',
    trendSubtitle: 'Moyenne journalière par classe de risque',
    critical: 'Critique',
    atRiskLabel: 'À risque',
    normal: 'Normal',
    watchlistTitle: 'Surveillance critique',
    watchlistSubtitle: 'Patients nécessitant une attention immédiate',
    viewPatient: 'Voir',
    hr: 'FC',
    bp: 'PA',
    ef: 'FEVG',
    ecgTitle: 'Événements ECG récents',
    ecgSubtitle: "Dernières anomalies détectées par l'IA",
    distTitle: 'Répartition des risques',
    distSubtitle: (n: number) => `${n} patients au total`,
  },
  EN: {
    title: 'Dashboard',
    subtitle: (n: number) => `Real-time monitoring — ${n} active patients`,
    updated: 'Updated:',
    totalPatients: 'Total Patients',
    underWatch: 'Under active monitoring',
    activeAlerts: 'Active Alerts',
    needAttention: 'Require attention',
    criticalCases: 'Critical Cases',
    avgAI: 'Avg AI Score',
    atRisk: (n: number) => `${n} at-risk patients`,
    trendTitle: 'AI Risk Score Trend — 7 Days',
    trendSubtitle: 'Daily average by risk class',
    critical: 'Critical',
    atRiskLabel: 'At Risk',
    normal: 'Normal',
    watchlistTitle: 'Critical Watchlist',
    watchlistSubtitle: 'Patients requiring immediate attention',
    viewPatient: 'View',
    hr: 'HR',
    bp: 'BP',
    ef: 'EF',
    ecgTitle: 'Recent ECG Events',
    ecgSubtitle: 'Latest anomalies detected by AI',
    distTitle: 'Risk Distribution',
    distSubtitle: (n: number) => `${n} patients total`,
  },
};

/* ─── Aggregated 7-day trend ────────────────────────────────────────────────── */
const buildTrendData = () => {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const criticalPts = patients.filter((p) => p.riskClass === 'Critical');
  const atRiskPts   = patients.filter((p) => p.riskClass === 'At Risk');
  const normalPts   = patients.filter((p) => p.riskClass === 'Normal');
  return days.map((day, i) => {
    const avg = (pts: typeof patients) =>
      pts.length
        ? Math.round(pts.reduce((s, p) => s + (p.riskHistory[i]?.score ?? p.aiScore), 0) / pts.length)
        : 0;
    return { day, critical: avg(criticalPts), atRisk: avg(atRiskPts), normal: avg(normalPts) };
  });
};

/* ─── Stat Card ─────────────────────────────────────────────────────────────── */
const StatCard: React.FC<{
  title: string; value: string | number; subtitle: string;
  icon: React.ReactNode; color: string; trend?: string; trendUp?: boolean;
}> = ({ title, value, subtitle, icon, color, trend, trendUp }) => (
  <div
    className="rounded-xl p-5 flex items-start gap-4"
    style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)' }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: `${color}18` }}
    >
      <div style={{ color }}>{icon}</div>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--cd-t4)' }}>{title}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--cd-t4)' }}>{subtitle}</p>
    </div>
    {trend && (
      <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${trendUp ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
        {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {trend}
      </div>
    )}
  </div>
);

/* ─── Custom Chart Tooltip ───────────────────────────────────────────────────── */
const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: { color: string; name: string; value: number }[];
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ backgroundColor: 'var(--cd-bg2)', border: '1px solid var(--cd-bd)' }}
    >
      <p className="font-semibold mb-1" style={{ color: 'var(--cd-t3)' }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span style={{ color: 'var(--cd-t3)' }}>{entry.name}:</span>
          <span className="font-bold" style={{ color: entry.color }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Severity Dot ───────────────────────────────────────────────────────────── */
const SeverityDot: React.FC<{ severity: string }> = ({ severity }) => {
  const color = severity === 'critical' ? '#EF4444' : severity === 'warning' ? '#F59E0B' : '#0EA5E9';
  return <span className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: color }} />;
};

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const tr = t[lang];
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const criticalCount = patients.filter((p) => p.riskClass === 'Critical').length;
  const atRiskCount   = patients.filter((p) => p.riskClass === 'At Risk').length;
  const normalCount   = patients.filter((p) => p.riskClass === 'Normal').length;
  const avgScore      = Math.round(patients.reduce((s, p) => s + p.aiScore, 0) / patients.length);
  const activeAlerts  = alerts.filter((a) => a.isConfirmed === null).length;

  const trendData      = buildTrendData();
  const criticalPts    = patients.filter((p) => p.riskClass === 'Critical');

  const ecgEvents = patients
    .flatMap((p) =>
      p.alertTimeline
        .filter((e) => e.severity !== 'info')
        .map((e) => ({ ...e, patientName: p.name, patientId: p.id }))
    )
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 7);

  const radialData = [
    { name: tr.critical,    value: criticalCount, fill: '#EF4444' },
    { name: tr.atRiskLabel, value: atRiskCount,   fill: '#F59E0B' },
    { name: tr.normal,      value: normalCount,   fill: '#10B981' },
  ];

  useEffect(() => {
    const id = setInterval(() => setLastUpdate(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-xl" style={{ color: 'var(--cd-t1)' }}>{tr.title}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--cd-t4)' }}>{tr.subtitle(patients.length)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs hidden sm:block" style={{ color: 'var(--cd-t5)' }}>
            {tr.updated}{' '}
            {lastUpdate.toLocaleTimeString(lang === 'FR' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => setLastUpdate(new Date())}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)', color: 'var(--cd-t4)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#0EA5E9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cd-t4)'; }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={tr.totalPatients} value={patients.length} subtitle={tr.underWatch}    icon={<Users className="w-5 h-5" />}         color="#0EA5E9" trend="+2" trendUp />
        <StatCard title={tr.activeAlerts}  value={activeAlerts}    subtitle={tr.needAttention} icon={<AlertTriangle className="w-5 h-5" />} color="#EF4444" trend="+1" trendUp={false} />
        <StatCard title={tr.criticalCases} value={criticalCount}   subtitle="Score IA > 75"   icon={<Activity className="w-5 h-5" />}      color="#F59E0B" />
        <StatCard title={tr.avgAI}         value={`${avgScore}/100`} subtitle={tr.atRisk(atRiskCount)} icon={<TrendingUp className="w-5 h-5" />} color="#10B981" />
      </div>

      {/* ── Trend Chart (full width) ── */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--cd-t1)' }}>{tr.trendTitle}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--cd-t4)' }}>{tr.trendSubtitle}</p>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--cd-t4)' }}>
            {[
              { c: '#EF4444', l: tr.critical },
              { c: '#F59E0B', l: tr.atRiskLabel },
              { c: '#10B981', l: tr.normal },
            ].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              {(['critical', 'atRisk', 'normal'] as const).map((key, i) => {
                const col = ['#EF4444', '#F59E0B', '#10B981'][i];
                return (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop key={`${key}-s1`} offset="5%"  stopColor={col} stopOpacity={0.25} />
                    <stop key={`${key}-s2`} offset="95%" stopColor={col} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--cd-bd)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--cd-t4)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--cd-t4)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="critical" name={tr.critical}    stroke="#EF4444" strokeWidth={2} fill="url(#grad-critical)" dot={false} activeDot={{ r: 4, fill: '#EF4444' }} />
            <Area type="monotone" dataKey="atRisk"   name={tr.atRiskLabel} stroke="#F59E0B" strokeWidth={2} fill="url(#grad-atRisk)"   dot={false} activeDot={{ r: 4, fill: '#F59E0B' }} />
            <Area type="monotone" dataKey="normal"   name={tr.normal}      stroke="#10B981" strokeWidth={2} fill="url(#grad-normal)"   dot={false} activeDot={{ r: 4, fill: '#10B981' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Critical Watchlist */}
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)' }}>
          <h2 className="font-semibold text-sm flex items-center gap-2 mb-1" style={{ color: 'var(--cd-t1)' }}>
            <span className="w-2 h-2 bg-[#EF4444] rounded-full animate-pulse" />
            {tr.watchlistTitle}
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--cd-t4)' }}>{tr.watchlistSubtitle}</p>
          <div className="space-y-3">
            {criticalPts.map((p) => (
              <div
                key={p.id}
                className="rounded-xl p-3 cursor-pointer transition-all"
                style={{ backgroundColor: 'var(--cd-bg1)', border: '1px solid rgba(239,68,68,0.2)' }}
                onClick={() => navigate(`/patients/${p.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EF4444] to-[#dc2626] flex items-center justify-center text-white text-[10px] font-bold">
                      {p.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--cd-t1)' }}>{p.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--cd-t4)' }}>{p.condition}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <span className="text-sm font-bold text-[#EF4444]">{p.aiScore}</span>
                    <span className="text-[10px]" style={{ color: 'var(--cd-t5)' }}>/100</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { label: tr.hr, value: `${p.heartRate}bpm`, color: '#EF4444' },
                    { label: tr.bp, value: p.bloodPressure,     color: '#F59E0B' },
                    { label: tr.ef, value: `${p.ejectionFraction}%`, color: '#0EA5E9' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex-1 rounded-lg p-1.5 text-center" style={{ backgroundColor: `${color}10` }}>
                      <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--cd-t5)' }}>{label}</p>
                      <p className="text-xs font-bold" style={{ color }}>{value}</p>
                    </div>
                  ))}
                  <button
                    className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] transition-all"
                    style={{ backgroundColor: 'rgba(14,165,233,0.08)', color: '#0EA5E9', border: '1px solid rgba(14,165,233,0.2)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.18)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.08)'; }}
                  >
                    {tr.viewPatient}<ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ECG Events Feed */}
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)' }}>
          <h2 className="font-semibold text-sm flex items-center gap-2 mb-1" style={{ color: 'var(--cd-t1)' }}>
            <Zap className="w-4 h-4 text-[#F59E0B]" />
            {tr.ecgTitle}
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--cd-t4)' }}>{tr.ecgSubtitle}</p>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 380 }}>
            {ecgEvents.map((event, i) => (
              <div
                key={`ecg-${i}`}
                className="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors"
                style={{ backgroundColor: 'var(--cd-bg1)', border: '1px solid var(--cd-bd2)' }}
                onClick={() => navigate(`/patients/${event.patientId}`)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cd-bd)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--cd-bd2)'; }}
              >
                <SeverityDot severity={event.severity} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: event.severity === 'critical' ? '#EF4444' : '#F59E0B' }}
                    >
                      {event.type}
                    </span>
                    <span className="text-[10px] font-mono flex items-center gap-1" style={{ color: 'var(--cd-t5)' }}>
                      <Clock className="w-2.5 h-2.5" />{event.time}
                    </span>
                  </div>
                  <p className="text-xs leading-snug" style={{ color: 'var(--cd-t3)' }}>{event.message}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--cd-t5)' }}>{event.patientName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)' }}>
          <h2 className="font-semibold text-sm flex items-center gap-2 mb-1" style={{ color: 'var(--cd-t1)' }}>
            <Stethoscope className="w-4 h-4 text-[#0EA5E9]" />
            {tr.distTitle}
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--cd-t4)' }}>{tr.distSubtitle(patients.length)}</p>
          <div className="flex flex-col items-center gap-5 flex-1 justify-center">
            <PieChart width={160} height={160}>
              <Pie
                data={radialData}
                cx={75} cy={75}
                innerRadius={45} outerRadius={75}
                dataKey="value"
                strokeWidth={0}
              >
                {radialData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
            <div className="w-full space-y-3">
              {radialData.map(({ name, value, fill }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fill }} />
                      <span className="text-xs" style={{ color: 'var(--cd-t3)' }}>{name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold" style={{ color: fill }}>{value}</span>
                      <span className="text-[10px]" style={{ color: 'var(--cd-t5)' }}>
                        ({Math.round((value / patients.length) * 100)}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--cd-bd)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((value / patients.length) * 100)}%`,
                        backgroundColor: fill,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
