import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Locked, Email, Checkmark, Close, Calendar } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Empty, StatusBadge, Avatar } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, DetailSection, DetailLead, Field, DetailText } from '../components/DetailPanel';
import { useAction } from '../api/useAction';
import { useAuth } from '../auth/AuthContext';

interface PrayerRow {
  id: string;
  who: string;
  visibility: string;
  text: string;
  status: string;
  at: string;
}
interface Appointment {
  id: string;
  slotStart: string;
  status: string;
  topic: { label: string; description?: string | null };
  user: { firstName: string | null; lastName: string | null; phone?: string | null };
  pastor?: { firstName: string | null; lastName: string | null } | null;
  location?: string | null;
  notes?: string | null;
  createdAt?: string | null;
}

const memberName = (a: Appointment) =>
  `${a.user.firstName ?? ''} ${a.user.lastName ?? ''}`.trim() || 'Membre';

const pastorName = (a: Appointment) =>
  a.pastor ? `${a.pastor.firstName ?? ''} ${a.pastor.lastName ?? ''}`.trim() : '';

// Décrit le statut en langage clair plutôt que de répéter le code brut.
const APPT_STATUS_DESC: Record<string, string> = {
  tentative: 'Demande reçue, en attente de confirmation par le staff.',
  confirmed: 'Rendez-vous confirmé — le membre a été notifié.',
  cancelled: 'Rendez-vous annulé.',
};
const PRAYER_STATUS_DESC: Record<string, string> = {
  pending: 'En attente de modération dans la file de care.',
  approved: 'Approuvée et visible sur le mur de prière.',
  answered: 'Une réponse pastorale a été envoyée au demandeur.',
  rejected: 'Demande rejetée.',
};
const VISIBILITY_DESC: Record<string, string> = {
  private: 'Confidentielle — visible du staff uniquement, exclue des analyses et exports.',
  anon: 'Publique mais anonyme — le nom du demandeur n’est pas affiché.',
  public: 'Publique — visible et nominative sur le mur de prière.',
};

const dateLong = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

/** Cellule "quand" : pastille de date + heure dessous (au lieu d'une date US verbeuse). */
function WhenCell({ iso }: { iso: string }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return <span className="text-mono">—</span>;
  const startOf = (x: Date) => {
    const c = new Date(x);
    c.setHours(0, 0, 0, 0);
    return c.getTime();
  };
  const isToday = startOf(d) === startOf(new Date());
  return (
    <div className="cds-namecell">
      <span
        className={'cds-datepill' + (isToday ? ' cds-datepill--today' : '')}
        title={d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      >
        <span className="cds-datepill__day">{d.getDate()}</span>
        <span className="cds-datepill__mon">{d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</span>
      </span>
      <span className="cds-namecell__sub" style={{ marginTop: 0 }}>
        {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

export default function Care() {
  const { can } = useAuth();
  const mayManageCare = can('care.manage');
  const mayManageAppts = can('appointments.manage');

  // Sélection courante → ouvre le détail (principe : clic ligne → détail).
  const [prayer, setPrayer] = useState<PrayerRow | null>(null);
  const [appt, setAppt] = useState<Appointment | null>(null);

  const queue = useQuery({
    queryKey: ['prayer-queue'],
    queryFn: async () => (await api.get('/prayers/queue')).data.data as PrayerRow[],
  });
  const appts = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => (await api.get('/appointments')).data as Appointment[],
  });

  const approve = useAction<PrayerRow>({
    mutationFn: (p) => api.patch(`/prayers/${p.id}/status`, { status: 'approved' }),
    invalidate: [['prayer-queue']],
    confirm: (p) => ({
      title: 'Approuver cette prière ?',
      message: `La demande de ${p.who} sera publiée et sortira de la file de modération.`,
      confirmLabel: 'Approuver',
    }),
    successTitle: 'Prière approuvée',
    errorTitle: "L'approbation a échoué",
    onDone: () => setPrayer(null),
  });

  const respond = useAction<PrayerRow>({
    mutationFn: (p) =>
      api.post(`/prayers/${p.id}/respond`, { message: 'Thank you — we are praying with you.' }),
    invalidate: [['prayer-queue']],
    confirm: (p) => ({
      title: 'Envoyer une réponse pastorale ?',
      message: `Un message d'encouragement sera envoyé à ${p.who}.`,
      confirmLabel: 'Envoyer',
    }),
    successTitle: 'Réponse envoyée',
    errorTitle: "L'envoi a échoué",
  });

  const setApptStatus = useAction<{ appt: Appointment; status: 'confirmed' | 'cancelled' }>({
    mutationFn: ({ appt, status }) => api.patch(`/appointments/${appt.id}`, { status }),
    invalidate: [['appointments']],
    confirm: ({ appt, status }) => ({
      title: status === 'confirmed' ? 'Confirmer le rendez-vous ?' : 'Annuler le rendez-vous ?',
      message:
        status === 'confirmed'
          ? `Le rendez-vous « ${appt.topic.label} » sera marqué confirmé pour le membre.`
          : `Le rendez-vous « ${appt.topic.label} » sera annulé. Le membre en sera informé.`,
      confirmLabel: status === 'confirmed' ? 'Confirmer' : 'Annuler le RDV',
      danger: status === 'cancelled',
    }),
    successTitle: (_data, { status }) =>
      status === 'confirmed' ? 'Rendez-vous confirmé' : 'Rendez-vous annulé',
    errorTitle: 'La mise à jour a échoué',
    onDone: () => setAppt(null),
  });

  const visTone = (v: string) => (v === 'private' ? 'blue' : v === 'public' ? 'green' : 'gray');

  return (
    <>
      <PageHead
        title="Soin pastoral"
        subtitle="File de prières confidentielle & rendez-vous du jour"
      />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          {/* Bannière de confidentialité */}
          <div className="cds-notification cds-notification--warn">
            <span className="cds-notification__icon">
              <Locked size={20} />
            </span>
            <div style={{ flex: 1 }}>
              <div className="cds-notification__title">La confidentialité pastorale est active</div>
              <div className="cds-notification__body">
                Les demandes de prière privées sont protégées et exclues des analyses, exports et
                fonctions IA. Chaque accès est journalisé.
              </div>
            </div>
          </div>

          {/* Master / detail */}
          <div className="cds-split" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
            {/* File de prières */}
            <Panel
              title="File de prières"
              sub={queue.data ? `${queue.data.length} en attente` : undefined}
              actions={<FreshnessBadge query={queue} />}
            >
              <QueryBoundary
                query={queue}
                isEmpty={(d) => d.length === 0}
                empty={<Empty>File vide 🎉</Empty>}
                loadingLabel="Chargement de la file…"
              >
                {(rows) => (
                  <table className="cds-data-table cds-data-table--zebra">
                    <thead>
                      <tr>
                        <th>Demandeur</th>
                        <th>Visibilité</th>
                        <th>Demande</th>
                        {mayManageCare && <th className="num">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => (
                        <tr
                          key={p.id}
                          className="is-clickable"
                          tabIndex={0}
                          onClick={() => setPrayer(p)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setPrayer(p);
                            }
                          }}
                        >
                          <td>
                            <div className="cds-namecell">
                              <Avatar name={p.who} size={28} />
                              <div className="cds-namecell__title">{p.who}</div>
                            </div>
                          </td>
                          <td>
                            <Tag tone={visTone(p.visibility)}>{p.visibility}</Tag>
                          </td>
                          <td className="truncate" style={{ maxWidth: 280, color: 'var(--text-02)' }}>
                            {p.text}
                          </td>
                          {mayManageCare && (
                            <td className="num" onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'inline-flex', gap: 4 }}>
                                <button
                                  className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                                  title="Approuver"
                                  disabled={approve.isPending}
                                  onClick={() => approve.run(p)}
                                >
                                  <Checkmark size={16} />
                                </button>
                                <button
                                  className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                                  title="Répondre"
                                  disabled={respond.isPending}
                                  onClick={() => respond.run(p)}
                                >
                                  <Email size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </QueryBoundary>
            </Panel>

            {/* Rendez-vous */}
            <Panel
              title="Rendez-vous"
              sub={appts.data ? `${appts.data.length} planifiés` : undefined}
              actions={<FreshnessBadge query={appts} />}
            >
              <QueryBoundary
                query={appts}
                isEmpty={(d) => d.length === 0}
                empty={<Empty icon={<Calendar size={20} />}>Aucun rendez-vous planifié.</Empty>}
                loadingLabel="Chargement des rendez-vous…"
              >
                {(rows) => (
                  <table className="cds-data-table">
                    <thead>
                      <tr>
                        <th>Quand</th>
                        <th>Membre</th>
                        <th>Sujet</th>
                        <th>Statut</th>
                        {mayManageAppts && <th className="num">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((a) => (
                        <tr
                          key={a.id}
                          className="is-clickable"
                          tabIndex={0}
                          onClick={() => setAppt(a)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setAppt(a);
                            }
                          }}
                        >
                          <td>
                            <WhenCell iso={a.slotStart} />
                          </td>
                          <td>
                            <div className="cds-namecell">
                              <Avatar name={memberName(a)} size={28} />
                              <div className="cds-namecell__title">{memberName(a)}</div>
                            </div>
                          </td>
                          <td className="text-02">{a.topic.label}</td>
                          <td>
                            <StatusBadge status={a.status} />
                          </td>
                          {mayManageAppts && (
                            <td className="num" onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'inline-flex', gap: 4 }}>
                                {a.status !== 'confirmed' && (
                                  <button
                                    className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                                    title="Confirmer"
                                    disabled={setApptStatus.isPending}
                                    onClick={() => setApptStatus.run({ appt: a, status: 'confirmed' })}
                                  >
                                    <Checkmark size={16} />
                                  </button>
                                )}
                                <button
                                  className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                                  title="Annuler"
                                  style={{ color: 'var(--red-60)' }}
                                  disabled={setApptStatus.isPending}
                                  onClick={() => setApptStatus.run({ appt: a, status: 'cancelled' })}
                                >
                                  <Close size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </QueryBoundary>
            </Panel>
          </div>
        </div>
      </div>

      {/* ── Détail prière ── */}
      <DetailPanel
        open={!!prayer}
        onClose={() => setPrayer(null)}
        media={prayer && <Avatar name={prayer.who} size={44} />}
        eyebrow="Demande de prière"
        title={prayer?.who ?? 'Demande de prière'}
        subtitle={
          prayer && (
            <>
              <Tag tone={visTone(prayer.visibility)}>{prayer.visibility}</Tag>
              <StatusBadge status={prayer.status} />
            </>
          )
        }
        footer={
          prayer &&
          mayManageCare && (
            <>
              <button
                className="cds-btn cds-btn--ghost cds-btn--md"
                disabled={respond.isPending}
                onClick={() => respond.run(prayer)}
              >
                Répondre
                <Email size={16} />
              </button>
              <button
                className="cds-btn cds-btn--md"
                disabled={approve.isPending}
                onClick={() => approve.run(prayer)}
              >
                Approuver
                <Checkmark size={16} />
              </button>
            </>
          )
        }
      >
        {prayer && (
          <>
            <DetailLead>
              <strong>{prayer.who}</strong> a soumis une demande de prière{' '}
              {prayer.at ? `le ${dateLong(prayer.at)}` : ''}.{' '}
              {PRAYER_STATUS_DESC[prayer.status] ?? ''}
            </DetailLead>

            <DetailSection title="Contenu de la demande">
              <DetailText>{prayer.text}</DetailText>
            </DetailSection>

            <DetailSection title="Suivi pastoral">
              <Field label="Demandeur">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={prayer.who} size={22} />
                  {prayer.who}
                </span>
              </Field>
              <Field
                label="Confidentialité"
                hint={VISIBILITY_DESC[prayer.visibility]}
              >
                <Tag tone={visTone(prayer.visibility)}>{prayer.visibility}</Tag>
              </Field>
              <Field label="Statut" hint={PRAYER_STATUS_DESC[prayer.status]}>
                {prayer.status}
              </Field>
              <Field label="Reçue le">{prayer.at ? dateLong(prayer.at) : '—'}</Field>
            </DetailSection>
          </>
        )}
      </DetailPanel>

      {/* ── Détail rendez-vous ── */}
      <DetailPanel
        open={!!appt}
        onClose={() => setAppt(null)}
        media={appt && <Avatar name={memberName(appt)} size={44} />}
        eyebrow="Rendez-vous"
        title={appt?.topic.label ?? 'Rendez-vous'}
        subtitle={appt && <StatusBadge status={appt.status} />}
        footer={
          appt &&
          mayManageAppts && (
            <>
              <button
                className="cds-btn cds-btn--danger cds-btn--md"
                disabled={setApptStatus.isPending}
                onClick={() => setApptStatus.run({ appt, status: 'cancelled' })}
              >
                Annuler le RDV
                <Close size={16} />
              </button>
              {appt.status !== 'confirmed' && (
                <button
                  className="cds-btn cds-btn--md"
                  disabled={setApptStatus.isPending}
                  onClick={() => setApptStatus.run({ appt, status: 'confirmed' })}
                >
                  Confirmer
                  <Checkmark size={16} />
                </button>
              )}
            </>
          )
        }
      >
        {appt && (
          <>
            <DetailLead>
              <strong>{memberName(appt)}</strong> a pris rendez-vous pour «{' '}
              {appt.topic.label} » le <strong>{dateLong(appt.slotStart)}</strong>.{' '}
              {APPT_STATUS_DESC[appt.status] ?? ''}
            </DetailLead>

            <DetailSection title="Rendez-vous">
              <Field label="Sujet" hint={appt.topic.description ?? undefined}>
                {appt.topic.label}
              </Field>
              <Field label="Date & heure">{dateLong(appt.slotStart)}</Field>
              <Field label="Lieu">{appt.location ?? '—'}</Field>
              <Field label="Statut" hint={APPT_STATUS_DESC[appt.status]}>
                <StatusBadge status={appt.status} />
              </Field>
            </DetailSection>

            <DetailSection title="Personnes">
              <Field label="Membre">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={memberName(appt)} size={22} />
                  {memberName(appt)}
                </span>
              </Field>
              {appt.user.phone && (
                <Field label="Téléphone">
                  <span className="text-mono">{appt.user.phone}</span>
                </Field>
              )}
              <Field
                label="Pasteur"
                hint={pastorName(appt) ? undefined : 'Aucun pasteur n’a encore été assigné.'}
              >
                {pastorName(appt) || '—'}
              </Field>
            </DetailSection>

            <DetailSection title="Note du membre">
              <DetailText>{appt.notes ?? ''}</DetailText>
            </DetailSection>

            {appt.createdAt && (
              <DetailSection title="Historique">
                <Field label="Demandé le">{dateLong(appt.createdAt)}</Field>
              </DetailSection>
            )}
          </>
        )}
      </DetailPanel>
    </>
  );
}
