import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle, CheckCircle, XCircle, Bell, Filter,
  Eye, Clock, FileText, X, ChevronRight, Lightbulb, Send,
} from 'lucide-react';
import { Alert, alerts as initialAlerts, patients } from '../data/mockData';
import { useLang } from '../context/LanguageContext';
import { useConversations } from '../context/ConversationsContext';

/* ─── Translations ─────────────────────────────────────────────────────────── */
const t = {
  FR: {
    title: "Centre d'Alertes",
    unread: (n: number) => `${n} non lues`,
    markAllRead: 'Tout marquer comme lu',
    statCritical: 'Critiques', statUnread: 'Non lues', statConfirmed: 'Confirmées',
    filterAll: 'Toutes', filterUnread: 'Non lues', filterCritical: 'Critiques', filterWarning: 'Avertissements',
    alertCount: (n: number) => `${n} alertes`,
    aiScore: 'Score IA:',
    confirm: 'Confirmer',
    dismiss: 'Ignorer',
    confirmed: 'Confirmée',
    dismissed: 'Ignorée',
    viewPatient: 'Voir patient',
    critical: '⚠ CRITIQUE',
    warning: '⚡ AVERTISSEMENT',
    empty: 'Aucune alerte dans cette catégorie.',
    // Modal
    modalTitle: 'Confirmer l\'alerte',
    modalSubtitle: 'Ajoutez une note médicale ou une recommandation avant de confirmer.',
    quickSuggestions: 'Suggestions rapides',
    customNote: 'Note personnalisée',
    notePlaceholder: 'Ajoutez vos observations, recommandations ou plan de prise en charge...',
    confirmWithNote: 'Confirmer avec note',
    confirmWithoutNote: 'Confirmer sans note',
    cancel: 'Annuler',
    noteAdded: 'Note médicale',
    confirmedAt: 'Confirmée à',
    sendToPatient: 'Envoyer au patient',
    sendToPatientHint: 'Le patient recevra cette note dans sa messagerie',
    urgencySent: 'Alerte d\'urgence envoyée au patient',
    urgencyMsg: (type: string) => `🚨 ALERTE URGENCE — ${type}. Votre cardiologue a été notifié et prend en charge votre situation. Restez calme et suivez les instructions reçues.`,
    noteSentMsg: (note: string) => `📋 Note de votre cardiologue :\n${note}`,
    sentToPatient: 'Envoyé au patient',
  },
  EN: {
    title: 'Alerts Center',
    unread: (n: number) => `${n} unread`,
    markAllRead: 'Mark all as read',
    statCritical: 'Critical', statUnread: 'Unread', statConfirmed: 'Confirmed',
    filterAll: 'All', filterUnread: 'Unread', filterCritical: 'Critical', filterWarning: 'Warnings',
    alertCount: (n: number) => `${n} alerts`,
    aiScore: 'AI Score:',
    confirm: 'Confirm',
    dismiss: 'Dismiss ❌',
    confirmed: 'Confirmed',
    dismissed: 'Dismissed',
    viewPatient: 'View patient',
    critical: '⚠ CRITICAL',
    warning: '⚡ WARNING',
    empty: 'No alerts in this category.',
    // Modal
    modalTitle: 'Confirm Alert',
    modalSubtitle: 'Add a medical note or recommendation before confirming.',
    quickSuggestions: 'Quick suggestions',
    customNote: 'Custom note',
    notePlaceholder: 'Add your observations, recommendations or care plan...',
    confirmWithNote: 'Confirm with note',
    confirmWithoutNote: 'Confirm without note',
    cancel: 'Cancel',
    noteAdded: 'Medical note',
    confirmedAt: 'Confirmed at',
    sendToPatient: 'Send to patient',
    sendToPatientHint: 'The patient will receive this note in their messaging',
    urgencySent: 'Urgency alert sent to patient',
    urgencyMsg: (type: string) => `🚨 URGENCY ALERT — ${type}. Your cardiologist has been notified and is managing your situation. Stay calm and follow the instructions you received.`,
    noteSentMsg: (note: string) => `📋 Note from your cardiologist:\n${note}`,
    sentToPatient: 'Sent to patient',
  },
};

const quickSuggestions = {
  FR: [
    'Augmenter les diurétiques',
    'ECG urgent requis',
    'Contacter le patient',
    'Hospitalisation à envisager',
    'Ajuster l\'anticoagulation',
    'Échocardiographie planifiée',
    'Surveillance rapprochée 24h',
    'Consultation anesthésie',
    'Bilan biologique urgent',
    'Réduire les bêtabloquants',
  ],
  EN: [
    'Increase diuretics',
    'Urgent ECG required',
    'Contact patient',
    'Consider hospitalization',
    'Adjust anticoagulation',
    'Echocardiography scheduled',
    'Close monitoring 24h',
    'Anesthesia consultation',
    'Urgent lab workup',
    'Reduce beta-blockers',
  ],
};

const newAlertPool: Omit<Alert, 'id'>[] = [
  {
    patientId: 'p11', patientName: 'Michel Lefebvre',
    type: 'Arythmie sévère',
    message: 'Nouvelle détection TV — Fréquence cardiaque 142 bpm.',
    timestamp: 'À l\'instant', isRead: false, isConfirmed: null, severity: 'critical', aiScore: 93,
  },
  {
    patientId: 'p1', patientName: 'Jean Dupont',
    type: 'Dégradation hémodynamique',
    message: 'Chute de pression artérielle détectée: 92/58 mmHg.',
    timestamp: 'À l\'instant', isRead: false, isConfirmed: null, severity: 'critical', aiScore: 90,
  },
  {
    patientId: 'p2', patientName: 'Marie Bernard',
    type: 'FA de novo',
    message: 'Fibrillation auriculaire rapide détectée, FC 128bpm.',
    timestamp: 'À l\'instant', isRead: false, isConfirmed: null, severity: 'warning', aiScore: 74,
  },
];

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const tr = t[lang];
  const { sendToPatient } = useConversations();
  const [alertList, setAlertList] = useState<Alert[]>(initialAlerts.map((a) => ({ ...a })));
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'warning'>('all');
  const [alertCounter, setAlertCounter] = useState(0);
  const [confirmingAlert, setConfirmingAlert] = useState<Alert | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setAlertCounter((c) => {
        const nextAlert = newAlertPool[c % newAlertPool.length];
        const newAlert: Alert = { ...nextAlert, id: `live_${Date.now()}`, timestamp: "À l'instant" };
        setAlertList((prev) => [newAlert, ...prev].slice(0, 30));
        return c + 1;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const confirmWithNote = (id: string, note: string, sendMsg: boolean) => {
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const alert = alertList.find((a) => a.id === id);
    setAlertList((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, isConfirmed: true, isRead: true, note: note.trim() || undefined, confirmedAt: now, sentToPatient: sendMsg }
          : a
      )
    );
    if (alert && sendMsg && note.trim()) {
      const patient = patients.find((p) => p.id === alert.patientId);
      const avatar = patient?.avatar ?? alert.patientName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
      sendToPatient(alert.patientId, alert.patientName, avatar, tr.noteSentMsg(note.trim()), false);
    }
    if (alert && alert.severity === 'critical') {
      const patient = patients.find((p) => p.id === alert.patientId);
      const avatar = patient?.avatar ?? alert.patientName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
      sendToPatient(alert.patientId, alert.patientName, avatar, tr.urgencyMsg(alert.type), true);
    }
    setConfirmingAlert(null);
  };

  const dismiss = (id: string) =>
    setAlertList((prev) => prev.map((a) => (a.id === id ? { ...a, isConfirmed: false, isRead: true } : a)));

  const markAllRead = () => setAlertList((prev) => prev.map((a) => ({ ...a, isRead: true })));

  const filtered = alertList.filter((a) => {
    if (filter === 'unread') return !a.isRead;
    if (filter === 'critical') return a.severity === 'critical';
    if (filter === 'warning') return a.severity === 'warning';
    return true;
  });

  const unreadCount = alertList.filter((a) => !a.isRead).length;
  const criticalCount = alertList.filter((a) => a.severity === 'critical' && a.isConfirmed === null).length;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-xl" style={{ color: 'var(--cd-t1)' }}>{tr.title}</h1>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 bg-[#EF4444] text-white text-xs font-bold rounded-full animate-pulse">
              {tr.unread(unreadCount)}
            </span>
          )}
        </div>
        <button onClick={markAllRead} className="text-[#0EA5E9] text-xs hover:underline">{tr.markAllRead}</button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="w-9 h-9 bg-[#EF4444]/15 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div>
            <p className="text-[#EF4444] font-bold text-lg">{criticalCount}</p>
            <p className="text-xs" style={{ color: 'var(--cd-t4)' }}>{tr.statCritical}</p>
          </div>
        </div>
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <div className="w-9 h-9 bg-[#F59E0B]/15 rounded-xl flex items-center justify-center">
            <Bell className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-[#F59E0B] font-bold text-lg">{unreadCount}</p>
            <p className="text-xs" style={{ color: 'var(--cd-t4)' }}>{tr.statUnread}</p>
          </div>
        </div>
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div className="w-9 h-9 bg-[#10B981]/15 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-[#10B981]" />
          </div>
          <div>
            <p className="text-[#10B981] font-bold text-lg">{alertList.filter((a) => a.isConfirmed === true).length}</p>
            <p className="text-xs" style={{ color: 'var(--cd-t4)' }}>{tr.statConfirmed}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4" style={{ color: 'var(--cd-t4)' }} />
        {([
          { key: 'all', label: tr.filterAll },
          { key: 'unread', label: tr.filterUnread },
          { key: 'critical', label: tr.filterCritical },
          { key: 'warning', label: tr.filterWarning },
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
        <span className="ml-auto text-xs" style={{ color: 'var(--cd-t4)' }}>{tr.alertCount(filtered.length)}</span>
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {filtered.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onConfirmRequest={() => setConfirmingAlert(alert)}
            onDismiss={dismiss}
            onView={() => navigate(`/patients/${alert.patientId}`)}
            tr={tr}
          />
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <CheckCircle className="w-12 h-12 text-[#10B981] mx-auto mb-3 opacity-50" />
            <p style={{ color: 'var(--cd-t4)' }}>{tr.empty}</p>
          </div>
        )}
      </div>

      {/* Confirm Note Modal */}
      {confirmingAlert && (
        <ConfirmNoteModal
          alert={confirmingAlert}
          tr={tr}
          lang={lang}
          onConfirm={(note, sendMsg) => confirmWithNote(confirmingAlert.id, note, sendMsg)}
          onClose={() => setConfirmingAlert(null)}
        />
      )}
    </div>
  );
};

/* ─── Alert Card ────────────────────────────────────────────────────────────── */
const AlertCard: React.FC<{
  alert: Alert;
  onConfirmRequest: () => void;
  onDismiss: (id: string) => void;
  onView: () => void;
  tr: typeof t['FR'];
}> = ({ alert, onConfirmRequest, onDismiss, onView, tr }) => {
  const isCritical = alert.severity === 'critical';
  const accentColor = isCritical ? '#EF4444' : '#F59E0B';

  return (
    <div
      className={`relative rounded-xl p-4 transition-all ${alert.isConfirmed === true ? 'opacity-70' : ''}`}
      style={{
        backgroundColor: 'var(--cd-bg3)',
        border: `1px solid var(--cd-bd)`,
        borderLeft: !alert.isRead ? `3px solid ${accentColor}` : `1px solid var(--cd-bd)`,
      }}
    >
      {!alert.isRead && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
      )}
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `${accentColor}18` }}
        >
          <AlertTriangle className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold" style={{ color: 'var(--cd-t1)' }}>{alert.patientName}</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
                >
                  {isCritical ? tr.critical : tr.warning}
                </span>
              </div>
              <p className="text-[#0EA5E9] text-xs font-medium mt-0.5">{alert.type}</p>
            </div>
            <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--cd-t5)' }}>
              <Clock className="w-3 h-3" />{alert.timestamp}
            </div>
          </div>

          {/* Message */}
          <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--cd-t3)' }}>{alert.message}</p>

          {/* AI Score */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs" style={{ color: 'var(--cd-t4)' }}>{tr.aiScore}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--cd-bd)' }}>
                <div className="h-full rounded-full" style={{ width: `${alert.aiScore}%`, backgroundColor: accentColor }} />
              </div>
              <span className="font-bold text-xs" style={{ color: accentColor }}>{alert.aiScore}/100</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {alert.isConfirmed === null && (
              <>
                <button
                  onClick={onConfirmRequest}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/25 text-[#10B981] rounded-lg text-xs font-medium transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {tr.confirm}
                </button>
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/25 text-[#EF4444] rounded-lg text-xs font-medium transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {tr.dismiss}
                </button>
              </>
            )}
            {alert.isConfirmed === true && (
              <span className="flex items-center gap-1 text-[#10B981] text-xs">
                <CheckCircle className="w-3 h-3" /> {tr.confirmed}
                {alert.confirmedAt && (
                  <span className="text-[10px] ml-1" style={{ color: 'var(--cd-t5)' }}>
                    · {tr.confirmedAt} {alert.confirmedAt}
                  </span>
                )}
              </span>
            )}
            {alert.isConfirmed === false && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--cd-t4)' }}>
                <XCircle className="w-3 h-3" /> {tr.dismissed}
              </span>
            )}
            <button
              onClick={onView}
              className="flex items-center gap-1 px-3 py-1.5 text-[#0EA5E9] rounded-lg text-xs transition-all ml-auto"
              style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(14,165,233,0.16)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(14,165,233,0.08)'; }}
            >
              <Eye className="w-3 h-3" />{tr.viewPatient}
            </button>
          </div>

          {/* Medical note (shown after confirmation) */}
          {alert.isConfirmed === true && alert.note && (
            <div
              className="mt-3 rounded-lg p-3 flex items-start gap-2"
              style={{ backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <FileText className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[10px] font-semibold text-[#10B981] uppercase tracking-wide">
                    {tr.noteAdded}
                  </p>
                  {alert.sentToPatient && (
                    <span className="flex items-center gap-0.5 text-[9px] font-medium text-[#0EA5E9] bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 px-1.5 py-0.5 rounded-full">
                      <Send className="w-2.5 h-2.5" />
                      {tr.sentToPatient}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cd-t3)' }}>{alert.note}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Confirm Note Modal ────────────────────────────────────────────────────── */
const ConfirmNoteModal: React.FC<{
  alert: Alert;
  tr: typeof t['FR'];
  lang: 'FR' | 'EN';
  onConfirm: (note: string, sendMsg: boolean) => void;
  onClose: () => void;
}> = ({ alert, tr, lang, onConfirm, onClose }) => {
  const [note, setNote] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [sendToPatient, setSendToPatient] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isCritical = alert.severity === 'critical';
  const accentColor = isCritical ? '#EF4444' : '#F59E0B';
  const suggestions = quickSuggestions[lang];

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const buildFinalNote = () => {
    const parts: string[] = [];
    if (selectedChips.length > 0) parts.push(selectedChips.join(' · '));
    if (note.trim()) parts.push(note.trim());
    return parts.join('\n');
  };

  const handleConfirm = () => onConfirm(buildFinalNote(), sendToPatient);
  const handleConfirmWithoutNote = () => onConfirm('', false);

  // Focus textarea on open
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const hasContent = selectedChips.length > 0 || note.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--cd-bg2)', border: '1px solid var(--cd-bd)' }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, #0EA5E9)` }} />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--cd-bd)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${accentColor}18` }}
            >
              <FileText className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--cd-t1)' }}>{tr.modalTitle}</h2>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--cd-t4)' }}>{tr.modalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--cd-t4)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--cd-hv)'; e.currentTarget.style.color = 'var(--cd-t1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--cd-t4)'; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alert summary */}
        <div className="mx-5 mt-4 rounded-xl p-3 flex items-center gap-3"
          style={{ backgroundColor: `${accentColor}0D`, border: `1px solid ${accentColor}30` }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold" style={{ color: 'var(--cd-t1)' }}>{alert.patientName}</span>
            <span className="mx-2 text-xs" style={{ color: 'var(--cd-t5)' }}>·</span>
            <span className="text-xs" style={{ color: accentColor }}>{alert.type}</span>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
          >
            {alert.aiScore}/100
          </span>
        </div>

        {/* Body */}
        <div className="px-5 pt-4 pb-5 space-y-4">
          {/* Quick suggestions */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-[#F59E0B]" />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--cd-t4)' }}>
                {tr.quickSuggestions}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((chip) => {
                const selected = selectedChips.includes(chip);
                return (
                  <button
                    key={chip}
                    onClick={() => toggleChip(chip)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={
                      selected
                        ? { backgroundColor: 'rgba(14,165,233,0.2)', color: '#0EA5E9', border: '1px solid rgba(14,165,233,0.4)' }
                        : { backgroundColor: 'var(--cd-bg3)', color: 'var(--cd-t4)', border: '1px solid var(--cd-bd)' }
                    }
                    onMouseEnter={(e) => { if (!selected) e.currentTarget.style.color = 'var(--cd-t1)'; }}
                    onMouseLeave={(e) => { if (!selected) e.currentTarget.style.color = 'var(--cd-t4)'; }}
                  >
                    {selected && <span className="mr-1">✓</span>}
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Free-text note */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5" style={{ color: 'var(--cd-t4)' }} />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--cd-t4)' }}>
                {tr.customNote}
              </p>
            </div>
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={tr.notePlaceholder}
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-xs resize-none outline-none transition-all"
              style={{
                backgroundColor: 'var(--cd-bg3)',
                border: '1px solid var(--cd-bd)',
                color: 'var(--cd-t2)',
                caretColor: '#0EA5E9',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(14,165,233,0.5)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--cd-bd)'; }}
            />
          </div>

          {/* Send to patient toggle */}
          {hasContent && (
            <button
              onClick={() => setSendToPatient((v) => !v)}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-all"
              style={{
                backgroundColor: sendToPatient ? 'rgba(14,165,233,0.08)' : 'var(--cd-bg3)',
                border: sendToPatient ? '1px solid rgba(14,165,233,0.3)' : '1px solid var(--cd-bd)',
              }}
            >
              <div className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5" style={{ color: sendToPatient ? '#0EA5E9' : 'var(--cd-t4)' }} />
                <div className="text-left">
                  <p className="text-xs font-medium" style={{ color: sendToPatient ? '#0EA5E9' : 'var(--cd-t3)' }}>
                    {tr.sendToPatient}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--cd-t5)' }}>{tr.sendToPatientHint}</p>
                </div>
              </div>
              <div
                className="w-9 h-5 rounded-full relative transition-all flex-shrink-0"
                style={{ backgroundColor: sendToPatient ? '#0EA5E9' : 'var(--cd-bd)' }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
                  style={{ left: sendToPatient ? '17px' : '2px' }}
                />
              </div>
            </button>
          )}

          {/* Urgency notice for critical alerts */}
          {isCritical && (
            <div
              className="flex items-start gap-2 rounded-xl px-3 py-2.5"
              style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--cd-t3)' }}>
                {tr.urgencySent}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ backgroundColor: 'var(--cd-bg3)', color: 'var(--cd-t3)', border: '1px solid var(--cd-bd)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cd-t1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cd-t3)'; }}
            >
              {tr.cancel}
            </button>

            {!hasContent && (
              <button
                onClick={handleConfirmWithoutNote}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all"
                style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)'; }}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {tr.confirmWithoutNote}
              </button>
            )}

            {hasContent && (
              <button
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ml-auto"
                style={{ backgroundColor: '#10B981', color: 'white' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#059669'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#10B981'; }}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {tr.confirmWithNote}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {!hasContent && <div className="flex-1" />}
          </div>
        </div>
      </div>
    </div>
  );
};
