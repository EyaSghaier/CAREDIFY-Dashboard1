import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, Filter, Users, Eye, Activity, Heart } from 'lucide-react';
import { patients } from '../data/mockData';
import { useLang } from '../context/LanguageContext';

const t = {
  FR: {
    title: 'Patients',
    subtitle: (n: number) => `${n} patients enregistrés`,
    search: 'Rechercher un patient...',
    all: 'Tous', critical: 'Critiques', atRisk: 'À risque', normal: 'Normal',
    statCritical: 'Critiques', statAtRisk: 'À risque', statNormal: 'Normal',
    badgeCritical: 'Critique', badgeAtRisk: 'À risque', badgeNormal: 'Normal',
    years: 'ans', male: 'H', female: 'F',
    aiScore: 'Score IA',
    view: 'Voir',
    notFound: 'Aucun patient trouvé.',
  },
  EN: {
    title: 'Patients',
    subtitle: (n: number) => `${n} registered patients`,
    search: 'Search a patient...',
    all: 'All', critical: 'Critical', atRisk: 'At Risk', normal: 'Normal',
    statCritical: 'Critical', statAtRisk: 'At Risk', statNormal: 'Normal',
    badgeCritical: 'Critical', badgeAtRisk: 'At Risk', badgeNormal: 'Normal',
    years: 'y/o', male: 'M', female: 'F',
    aiScore: 'AI Score',
    view: 'View',
    notFound: 'No patients found.',
  },
};

const getRiskColor = (riskClass: string) => {
  if (riskClass === 'Critical') return '#EF4444';
  if (riskClass === 'At Risk') return '#F59E0B';
  return '#10B981';
};

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const tr = t[lang];
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Critical' | 'At Risk' | 'Normal'>('All');

  // Read search query from URL on mount
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearch(searchQuery);
    }
  }, [searchParams]);

  const filtered = patients.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.condition.toLowerCase().includes(search.toLowerCase()) ||
      p.diagnosis.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || p.riskClass === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-xl" style={{ color: 'var(--cd-t1)' }}>{tr.title}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--cd-t4)' }}>{tr.subtitle(patients.length)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 max-w-xs" style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)' }}>
          <Search className="w-3.5 h-3.5" style={{ color: 'var(--cd-t5)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr.search}
            className="bg-transparent text-sm outline-none w-full"
            style={{ color: 'var(--cd-t3)' }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4" style={{ color: 'var(--cd-t4)' }} />
          {([
            { key: 'All', label: tr.all },
            { key: 'Critical', label: tr.critical },
            { key: 'At Risk', label: tr.atRisk },
            { key: 'Normal', label: tr.normal },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={filter === key ? { backgroundColor: '#0EA5E9', color: 'white' } : { backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)', color: 'var(--cd-t4)' }}
              onMouseEnter={(e) => { if (filter !== key) e.currentTarget.style.color = 'var(--cd-t1)'; }}
              onMouseLeave={(e) => { if (filter !== key) e.currentTarget.style.color = 'var(--cd-t4)'; }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: tr.statCritical, count: patients.filter((p) => p.riskClass === 'Critical').length, color: '#EF4444' },
          { label: tr.statAtRisk,   count: patients.filter((p) => p.riskClass === 'At Risk').length,  color: '#F59E0B' },
          { label: tr.statNormal,   count: patients.filter((p) => p.riskClass === 'Normal').length,   color: '#10B981' },
        ].map(({ label, count, color }) => (
          <div key={label} className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--cd-bg3)', border: `1px solid ${color}25` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
              <Users className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color }}>{count}</p>
              <p className="text-xs" style={{ color: 'var(--cd-t4)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Patient Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((patient) => {
          const riskColor = getRiskColor(patient.riskClass);
          return (
            <div
              key={patient.id}
              className="rounded-xl p-4 cursor-pointer transition-all"
              style={{ backgroundColor: 'var(--cd-bg3)', border: 'var(--cd-bd)' }}
              onClick={() => navigate(`/patients/${patient.id}`)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${riskColor}40`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--cd-bd)'; e.currentTarget.style.transform = 'none'; }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: patient.riskClass === 'Critical' ? 'linear-gradient(135deg, #EF4444, #dc2626)' : patient.riskClass === 'At Risk' ? 'linear-gradient(135deg, #F59E0B, #d97706)' : 'linear-gradient(135deg, #10B981, #059669)', boxShadow: `0 0 16px ${riskColor}35` }}
                  >
                    {patient.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--cd-t1)' }}>{patient.name}</p>
                    <p className="text-xs" style={{ color: 'var(--cd-t4)' }}>{patient.age} {tr.years} · {patient.gender === 'M' ? tr.male : tr.female}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1" style={{ backgroundColor: `${riskColor}15`, color: riskColor, border: `1px solid ${riskColor}30` }}>
                  {patient.riskClass === 'Critical' && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: riskColor }} />}
                  {patient.riskClass === 'Critical' ? tr.badgeCritical : patient.riskClass === 'At Risk' ? tr.badgeAtRisk : tr.badgeNormal}
                </span>
              </div>

              <p className="text-xs mb-3 truncate" style={{ color: 'var(--cd-t3)' }}>{patient.condition}</p>

              {/* AI Score */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--cd-t5)' }}>{tr.aiScore}</span>
                  <span className="text-xs font-bold" style={{ color: riskColor }}>{patient.aiScore}/100</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--cd-bd)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${patient.aiScore}%`, backgroundColor: riskColor }} />
                </div>
              </div>

              {/* Vitals */}
              <div className="flex items-center justify-between py-2 rounded-lg px-3 mb-3" style={{ backgroundColor: 'var(--cd-bg1)' }}>
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3 h-3 text-[#EF4444]" />
                  <span className="text-xs font-medium" style={{ color: 'var(--cd-t3)' }}>{patient.heartRate} bpm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[#0EA5E9]" />
                  <span className="text-xs font-medium" style={{ color: 'var(--cd-t3)' }}>{patient.bloodPressure}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]" style={{ color: 'var(--cd-t4)' }}>FE</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--cd-t3)' }}>{patient.ejectionFraction}%</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
                  <span className="text-[10px]" style={{ color: 'var(--cd-t4)' }}>ECG {patient.lastECG}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-[#0EA5E9] transition-all"
                  style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(14,165,233,0.16)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(14,165,233,0.08)'; }}
                >
                  <Eye className="w-3 h-3" />
                  {tr.view}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center" style={{ color: 'var(--cd-t4)' }}>{tr.notFound}</div>
      )}
    </div>
  );
};