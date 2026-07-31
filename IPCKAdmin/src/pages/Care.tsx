import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Locked, Email, Checkmark, Close, Calendar } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Empty, StatusBadge, Avatar, statusLabel } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, DetailSection, DetailLead, Field, DetailText } from '../components/DetailPanel';
import { useAction } from '../api/useAction';
import { useAuth } from '../auth/AuthContext';
import { t, dateLocale } from '../i18n';

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
  `${a.user.firstName ?? ''} ${a.user.lastName ?? ''}`.trim() || t('care.member');

const pastorName = (a: Appointment) =>
  a.pastor ? `${a.pastor.firstName ?? ''} ${a.pastor.lastName ?? ''}`.trim() : '';

// Descriptions localisées (langage clair plutôt que code brut backend).
const apptStatusDesc = (s: string) =>
  ['tentative', 'confirmed', 'cancelled'].includes(s) ? t(`care.apptStatus.${s}`) : '';
const prayerStatusDesc = (s: string) =>
  ['pending', 'approved', 'answered', 'rejected'].includes(s) ? t(`care.prayerStatus.${s}`) : '';
const visibilityDesc = (v: string) =>
  ['private', 'anon', 'public'].includes(v) ? t(`visibility.${v}.desc`) : undefined;
const visibilityLabel = (v: string) =>
  ['private', 'anon', 'public'].includes(v) ? t(`visibility.${v}`) : v;

const dateLong = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString(dateLocale(), {
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
        title={d.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      >
        <span className="cds-datepill__day">{d.getDate()}</span>
        <span className="cds-datepill__mon">{d.toLocaleDateString(dateLocale(), { month: 'short' }).replace('.', '')}</span>
      </span>
      <span className="cds-namecell__sub" style={{ marginTop: 0 }}>
        {d.toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' })}
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
      title: t('care.confirmApproveTitle'),
      message: t('care.confirmApproveMsg').replace('{who}', p.who),
      confirmLabel: t('care.approve'),
    }),
    successTitle: t('care.approved'),
    errorTitle: t('care.approveFailed'),
    onDone: () => setPrayer(null),
  });

  const respond = useAction<PrayerRow>({
    mutationFn: (p) =>
      api.post(`/prayers/${p.id}/respond`, { message: 'Thank you — we are praying with you.' }),
    invalidate: [['prayer-queue']],
    confirm: (p) => ({
      title: t('care.confirmRespondTitle'),
      message: t('care.confirmRespondMsg').replace('{who}', p.who),
      confirmLabel: t('care.send'),
    }),
    successTitle: t('care.responseSent'),
    errorTitle: t('care.sendFailed'),
    onDone: () => setPrayer(null),
  });

  const setApptStatus = useAction<{ appt: Appointment; status: 'confirmed' | 'cancelled' }>({
    mutationFn: ({ appt, status }) => api.patch(`/appointments/${appt.id}`, { status }),
    invalidate: [['appointments']],
    confirm: ({ appt, status }) => ({
      title: status === 'confirmed' ? t('care.confirmApptTitle') : t('care.cancelApptTitle'),
      message:
        status === 'confirmed'
          ? t('care.confirmApptMsg').replace('{topic}', appt.topic.label)
          : t('care.cancelApptMsg').replace('{topic}', appt.topic.label),
      confirmLabel: status === 'confirmed' ? t('care.confirm') : t('care.cancelAppt'),
      danger: status === 'cancelled',
    }),
    successTitle: (_data, { status }) =>
      status === 'confirmed' ? t('care.apptConfirmed') : t('care.apptCancelled'),
    errorTitle: t('care.updateFailed'),
    onDone: () => setAppt(null),
  });

  const visTone = (v: string) => (v === 'private' ? 'blue' : v === 'public' ? 'green' : 'gray');

  return (
    <>
      <PageHead title={t('care.title')} subtitle={t('care.subtitle')} />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          {/* Bannière de confidentialité */}
          <div className="cds-notification cds-notification--warn">
            <span className="cds-notification__icon">
              <Locked size={20} />
            </span>
            <div style={{ flex: 1 }}>
              <div className="cds-notification__title">{t('care.privacyTitle')}</div>
              <div className="cds-notification__body">{t('care.privacyBody')}</div>
            </div>
          </div>

          {/* Master / detail */}
          <div className="cds-split" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
            {/* File de prières */}
            <Panel
              title={t('care.prayerQueue')}
              sub={queue.data ? `${queue.data.length} ${t('care.pending')}` : undefined}
              actions={<FreshnessBadge query={queue} />}
            >
              <QueryBoundary
                query={queue}
                isEmpty={(d) => d.length === 0}
                empty={<Empty>{t('care.emptyQueue')}</Empty>}
                loadingLabel={t('care.loadingQueue')}
              >
                {(rows) => (
                  <table className="cds-data-table cds-data-table--zebra">
                    <thead>
                      <tr>
                        <th>{t('care.colRequester')}</th>
                        <th>{t('care.colVisibility')}</th>
                        <th>{t('care.colRequest')}</th>
                        {mayManageCare && <th className="num">{t('care.colActions')}</th>}
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
                            <Tag tone={visTone(p.visibility)}>{visibilityLabel(p.visibility)}</Tag>
                          </td>
                          <td className="truncate" style={{ maxWidth: 280, color: 'var(--text-02)' }}>
                            {p.text}
                          </td>
                          {mayManageCare && (
                            <td className="num" onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'inline-flex', gap: 4 }}>
                                <button
                                  className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                                  title={t('care.approve')}
                                  disabled={approve.isPending}
                                  onClick={() => approve.run(p)}
                                >
                                  <Checkmark size={16} />
                                </button>
                                <button
                                  className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                                  title={t('care.respond')}
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
              title={t('care.appointments')}
              sub={appts.data ? `${appts.data.length} ${t('care.scheduled')}` : undefined}
              actions={<FreshnessBadge query={appts} />}
            >
              <QueryBoundary
                query={appts}
                isEmpty={(d) => d.length === 0}
                empty={<Empty icon={<Calendar size={20} />}>{t('care.emptyAppts')}</Empty>}
                loadingLabel={t('care.loadingAppts')}
              >
                {(rows) => (
                  <table className="cds-data-table">
                    <thead>
                      <tr>
                        <th>{t('care.colWhen')}</th>
                        <th>{t('care.colMember')}</th>
                        <th>{t('care.colTopic')}</th>
                        <th>{t('care.colStatus')}</th>
                        {mayManageAppts && <th className="num">{t('care.colActions')}</th>}
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
                                    title={t('care.confirm')}
                                    disabled={setApptStatus.isPending}
                                    onClick={() => setApptStatus.run({ appt: a, status: 'confirmed' })}
                                  >
                                    <Checkmark size={16} />
                                  </button>
                                )}
                                <button
                                  className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                                  title={t('care.cancel')}
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
        eyebrow={t('care.prayerEyebrow')}
        title={prayer?.who ?? t('care.prayerEyebrow')}
        subtitle={
          prayer && (
            <>
              <Tag tone={visTone(prayer.visibility)}>{visibilityLabel(prayer.visibility)}</Tag>
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
                {t('care.respond')}
                <Email size={16} />
              </button>
              <button
                className="cds-btn cds-btn--md"
                disabled={approve.isPending}
                onClick={() => approve.run(prayer)}
              >
                {t('care.approve')}
                <Checkmark size={16} />
              </button>
            </>
          )
        }
      >
        {prayer && (
          <>
            <DetailLead>
              <strong>{prayer.who}</strong> {t('care.prayerSubmitted')}{' '}
              {prayer.at ? `${t('care.on')} ${dateLong(prayer.at)}` : ''}.{' '}
              {prayerStatusDesc(prayer.status)}
            </DetailLead>

            <DetailSection title={t('care.requestContent')}>
              <DetailText>{prayer.text}</DetailText>
            </DetailSection>

            <DetailSection title={t('care.pastoralFollowup')}>
              <Field label={t('care.requester')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={prayer.who} size={22} />
                  {prayer.who}
                </span>
              </Field>
              <Field label={t('care.confidentiality')} hint={visibilityDesc(prayer.visibility)}>
                <Tag tone={visTone(prayer.visibility)}>{visibilityLabel(prayer.visibility)}</Tag>
              </Field>
              <Field label={t('care.colStatus')} hint={prayerStatusDesc(prayer.status)}>
                {statusLabel(prayer.status)}
              </Field>
              <Field label={t('care.receivedOn')}>{prayer.at ? dateLong(prayer.at) : '—'}</Field>
            </DetailSection>
          </>
        )}
      </DetailPanel>

      {/* ── Détail rendez-vous ── */}
      <DetailPanel
        open={!!appt}
        onClose={() => setAppt(null)}
        media={appt && <Avatar name={memberName(appt)} size={44} />}
        eyebrow={t('care.appt')}
        title={appt?.topic.label ?? t('care.appt')}
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
                {t('care.cancelAppt')}
                <Close size={16} />
              </button>
              {appt.status !== 'confirmed' && (
                <button
                  className="cds-btn cds-btn--md"
                  disabled={setApptStatus.isPending}
                  onClick={() => setApptStatus.run({ appt, status: 'confirmed' })}
                >
                  {t('care.confirm')}
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
              <strong>{memberName(appt)}</strong> {t('care.bookedFor')}{' '}
              {appt.topic.label} {t('care.topicClose')} {t('care.on')}{' '}
              <strong>{dateLong(appt.slotStart)}</strong>. {apptStatusDesc(appt.status)}
            </DetailLead>

            <DetailSection title={t('care.appt')}>
              <Field label={t('care.topic')} hint={appt.topic.description ?? undefined}>
                {appt.topic.label}
              </Field>
              <Field label={t('care.dateTime')}>{dateLong(appt.slotStart)}</Field>
              <Field label={t('care.place')}>{appt.location ?? '—'}</Field>
              <Field label={t('care.colStatus')} hint={apptStatusDesc(appt.status)}>
                <StatusBadge status={appt.status} />
              </Field>
            </DetailSection>

            <DetailSection title={t('care.people')}>
              <Field label={t('care.member')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={memberName(appt)} size={22} />
                  {memberName(appt)}
                </span>
              </Field>
              {appt.user.phone && (
                <Field label={t('care.phone')}>
                  <span className="text-mono">{appt.user.phone}</span>
                </Field>
              )}
              <Field
                label={t('care.pastor')}
                hint={pastorName(appt) ? undefined : t('care.noPastorAssigned')}
              >
                {pastorName(appt) || '—'}
              </Field>
            </DetailSection>

            <DetailSection title={t('care.memberNote')}>
              <DetailText>{appt.notes ?? ''}</DetailText>
            </DetailSection>

            {appt.createdAt && (
              <DetailSection title={t('care.history')}>
                <Field label={t('care.requestedOn')}>{dateLong(appt.createdAt)}</Field>
              </DetailSection>
            )}
          </>
        )}
      </DetailPanel>
    </>
  );
}
