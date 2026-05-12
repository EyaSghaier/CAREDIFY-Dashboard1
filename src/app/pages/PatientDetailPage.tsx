import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Heart, Activity, Thermometer, Droplet,
  Clock, Phone, Mail, Calendar, Download, Share2, Stethoscope,
} from 'lucide-react';
import { patients } from '../data/mockData';
import { RiskGauge } from '../components/RiskGauge';
import { ECGCanvas } from '../components/ECGCanvas';
import { ECG12LeadViewer } from '../components/ECG12LeadViewer';

/* ── Vital card ───────────────────────────────────────────────────── */
const VitalCard: React.FC<{
  icon: React.ReactNode; label: string; value: string; unit?: string; color: string;
}> = ({ icon, label, value, unit, color }) => (
  <div
    className="rounded-xl p-4"
    style={{ backgroundColor: 'var(--cd-bg1)', border: '1px solid var(--cd-bd)' }}
  >
    <div className="flex items-center gap-2 mb-2">
      <div style={{ color }}>{icon}</div>
      <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--cd-t4)' }}>
        {label}
      </span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="font-bold text-xl" style={{ color: 'var(--cd-t1)' }}>{value}</span>
      {unit && <span className="text-xs" style={{ color: 'var(--cd-t4)' }}>{unit}</span>}
    </div>
  </div>
);

/* ── Alert timeline event ─────────────────────────────────────────── */
const TimelineEvent: React.FC<{
  time: string; type: string; message: string;
  severity: 'info' | 'warning' | 'critical';
}> = ({ time, type, message, severity }) => {
  const colors = { info: '#0EA5E9', warning: '#F59E0B', critical: '#EF4444' };
  const c = colors[severity];
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}` }}
        />
        <div className="w-px flex-1 mt-1" style={{ backgroundColor: 'var(--cd-bd)' }} />
      </div>
      <div className="pb-4 flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-medium" style={{ color: c }}>{type}</span>
          <span className="text-xs" style={{ color: 'var(--cd-t5)' }}>{time}</span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--cd-t3)' }}>{message}</p>
      </div>
    </div>
  );
};

/* ── Pure-SVG 7-day risk history chart — no recharts ─────────────── */
const RiskHistorySVG: React.FC<{
  data: { date: string; score: number }[];
  color: string;
}> = ({ data, color }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  if (!data || data.length < 2) return null;

  const VB_W = 500;
  const VB_H = 140;
  const pL = 30; const pR = 8; const pT = 8; const pB = 24;
  const cW = VB_W - pL - pR;
  const cH = VB_H - pT - pB;

  const toX = (i: number) => pL + (i / (data.length - 1)) * cW;
  const toY = (v: number) => pT + cH - Math.max(0, Math.min(1, v / 100)) * cH;

  const linePoints = data.map((d, i) => `${toX(i)},${toY(d.score)}`).join(' ');
  const areaPoints = [
    `${toX(0)},${pT + cH}`,
    ...data.map((d, i) => `${toX(i)},${toY(d.score)}`),
    `${toX(data.length - 1)},${pT + cH}`,
  ].join(' ');

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height={VB_H}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {yTicks.map((v) => (
        <line
          key={`gy-${v}`}
          x1={pL} y1={toY(v)} x2={VB_W - pR} y2={toY(v)}
          stroke="var(--cd-bd)" strokeWidth={0.6} strokeDasharray="3 3"
        />
      ))}
      {yTicks.map((v) => (
        <text key={`yl-${v}`} x={pL - 4} y={toY(v) + 3.5}
          textAnchor="end" fontSize={9} fill="var(--cd-t5)">{v}</text>
      ))}
      {data.map((d, i) => (
        <text key={`xl-${d.date}`} x={toX(i)} y={VB_H - 4}
          textAnchor="middle" fontSize={9} fill="var(--cd-t5)">{d.date}</text>
      ))}
      <polygon points={areaPoints} fill={color} fillOpacity={0.11} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => (
        <g key={`pt-${d.date}`}>
          <rect
            x={toX(i) - 18} y={pT} width={36} height={cH}
            fill="transparent"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
          <circle cx={toX(i)} cy={toY(d.score)} r={hovered === i ? 5 : 3} fill={color} />
          {hovered === i && (
            <g>
              <rect
                x={toX(i) - 28} y={toY(d.score) - 30}
                width={56} height={22} rx={4}
                fill="var(--cd-bg3)" stroke="var(--cd-bd)" strokeWidth={0.8}
              />
              <text x={toX(i)} y={toY(d.score) - 15}
                textAnchor="middle" fontSize={10} fill={color} fontWeight="bold">
                {Math.round(d.score)}/100
              </text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
};

/* ── Main page ────────────────────────────────────────────────────── */
export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const patient = patients.find((p) => p.id === id);
  const [liveScore, setLiveScore] = useState(patient?.aiScore ?? 0);

  useEffect(() => {
    if (!patient) return;
    const interval = setInterval(() => {
      setLiveScore((prev) => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 3)));
    }, 3000);
    return () => clearInterval(interval);
  }, [patient]);

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--cd-t4)' }}>
        Patient introuvable.
      </div>
    );
  }

  const ecgColor =
    patient.riskClass === 'Critical' ? '#EF4444' :
    patient.riskClass === 'At Risk' ? '#F59E0B' : '#10B981';

  return (
    <div className="p-4 lg:p-6 space-y-5">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--cd-bg3)',
              border: '1px solid var(--cd-bd)',
              color: 'var(--cd-t4)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cd-t1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cd-t4)'; }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-bold text-lg" style={{ color: 'var(--cd-t1)' }}>
              {patient.name}
            </h1>
            <p className="text-xs" style={{ color: 'var(--cd-t4)' }}>{patient.diagnosis}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[Share2, Download].map((Icon, i) => (
            <button
              key={i}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--cd-bg3)',
                border: '1px solid var(--cd-bd)',
                color: 'var(--cd-t4)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cd-t1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cd-t4)'; }}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* ── 3-column grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT COLUMN */}
        <div className="space-y-4">

          {/* Profile card */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)' }}
          >
            <div className="flex flex-col items-center text-center mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-3"
                style={{
                  background:
                    patient.riskClass === 'Critical' ? 'linear-gradient(135deg,#EF4444,#dc2626)' :
                    patient.riskClass === 'At Risk'  ? 'linear-gradient(135deg,#F59E0B,#d97706)' :
                    'linear-gradient(135deg,#10B981,#059669)',
                  boxShadow: `0 0 20px ${ecgColor}40`,
                }}
              >
                {patient.avatar}
              </div>
              <h2 className="font-bold" style={{ color: 'var(--cd-t1)' }}>{patient.name}</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--cd-t4)' }}>{patient.condition}</p>
              <div className="mt-2">
                {patient.riskClass === 'Critical' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/25 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#EF4444] rounded-full animate-pulse" />
                    CRITIQUE
                  </span>
                )}
                {patient.riskClass === 'At Risk' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25">
                    À RISQUE
                  </span>
                )}
                {patient.riskClass === 'Normal' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25">
                    NORMAL
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2.5 text-xs pt-4" style={{ borderTop: '1px solid var(--cd-bd)' }}>
              {[
                { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Âge', value: `${patient.age} ans (${patient.gender === 'M' ? 'Homme' : 'Femme'})` },
                { icon: <Stethoscope className="w-3.5 h-3.5" />, label: 'Admission', value: patient.admissionDate },
                { icon: <Phone className="w-3.5 h-3.5" />, label: 'Téléphone', value: patient.phone },
                { icon: <Mail className="w-3.5 h-3.5" />, label: 'Email', value: patient.email },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <div style={{ color: 'var(--cd-t4)' }}>{icon}</div>
                  <span className="w-20 flex-shrink-0" style={{ color: 'var(--cd-t5)' }}>{label}:</span>
                  <span className="truncate" style={{ color: 'var(--cd-t3)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Vitals grid */}
          <div className="grid grid-cols-2 gap-3">
            <VitalCard icon={<Heart className="w-4 h-4" />}       label="Fréq. cardiaque" value={`${patient.heartRate}`}        unit="bpm"  color="#EF4444" />
            <VitalCard icon={<Droplet className="w-4 h-4" />}     label="Pression art."   value={patient.bloodPressure}         unit="mmHg" color="#0EA5E9" />
            <VitalCard icon={<Activity className="w-4 h-4" />}    label="FEVG"             value={`${patient.ejectionFraction}`} unit="%"    color={patient.ejectionFraction < 40 ? '#EF4444' : '#10B981'} />
            <VitalCard icon={<Thermometer className="w-4 h-4" />} label="Temp."            value="37.1"                         unit="°C"   color="#F59E0B" />
          </div>

          {/* AI Risk Gauge */}
          <div
            className="rounded-xl p-4 flex flex-col items-center"
            style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)' }}
          >
            <h3 className="font-medium text-sm mb-3 self-start" style={{ color: 'var(--cd-t1)' }}>
              Score IA en Temps Réel
            </h3>
            <RiskGauge score={Math.round(liveScore)} size={200} />
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
              <span className="text-xs" style={{ color: 'var(--cd-t4)' }}>Mise à jour en continu</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">

          {/* Live ECG */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: ecgColor }} />
                <h3 className="font-medium text-sm" style={{ color: 'var(--cd-t1)' }}>
                  ECG en Temps Réel
                </h3>
                <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                <span className="text-[#10B981] text-xs">En direct</span>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--cd-t4)' }}>
                <span>25 mm/s</span>
                <span>10 mm/mV</span>
                <span className="font-bold" style={{ color: ecgColor }}>{patient.heartRate} bpm</span>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--cd-bd)' }}>
              <ECGCanvas
                heartRate={patient.heartRate}
                height={140}
                color={ecgColor}
                isAbnormal={patient.riskClass === 'Critical'}
              />
            </div>
          </div>

          {/* 7-day Risk History — pure SVG, no recharts */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm" style={{ color: 'var(--cd-t1)' }}>
                Historique du Risque — 7 jours
              </h3>
              <span className="text-xs" style={{ color: 'var(--cd-t4)' }}>Score IA quotidien</span>
            </div>
            <RiskHistorySVG data={patient.riskHistory} color={ecgColor} />
          </div>

          {/* Alert Timeline */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[#0EA5E9]" />
              <h3 className="font-medium text-sm" style={{ color: 'var(--cd-t1)' }}>
                Chronologie des Alertes
              </h3>
            </div>
            <div className="space-y-0">
              {patient.alertTimeline.map((event, idx) => (
                <TimelineEvent key={idx} {...event} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 12-Lead ECG ──────────────────────────────────────────── */}
      <ECG12LeadViewer
        heartRate={patient.heartRate}
        riskClass={patient.riskClass}
        patientName={patient.name}
        isAbnormal={patient.riskClass === 'Critical'}
      />
    </div>
  );
};
