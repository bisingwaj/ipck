import { useQuery } from '@tanstack/react-query';
import { Locked, Email, Checkmark, Close } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Empty } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
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
  topic: { label: string };
  user: { firstName: string | null; lastName: string | null };
}

export default function Care() {
  const { can } = useAuth();
  const mayManageCare = can('care.manage');
  const mayManageAppts = can('appointments.manage');

  const queue = useQuery({
    queryKey: ['prayer-queue'],
    queryFn: async () => (await api.get('/prayers/queue')).data.data as PrayerRow[],
  });
  const appts = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => (await api.get('/appointments')).data as Appointment[],
  });

  // Principe 3 : approuver = confirmation + blocage + retour obligatoire.
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
    errorTitle: "La mise à jour a échoué",
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
                  <table className="cds-data-table">
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
                        <tr key={p.id}>
                          <td>{p.who}</td>
                          <td>
                            <Tag tone={visTone(p.visibility)}>{p.visibility}</Tag>
                          </td>
                          <td className="truncate" style={{ maxWidth: 280, color: 'var(--text-02)' }}>
                            {p.text}
                          </td>
                          {mayManageCare && (
                            <td className="num">
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
                empty={<Empty>Aucun rendez-vous</Empty>}
                loadingLabel="Chargement des rendez-vous…"
              >
                {(rows) => (
                  <table className="cds-data-table cds-data-table--compact">
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
                        <tr key={a.id}>
                          <td className="text-mono">{new Date(a.slotStart).toLocaleString()}</td>
                          <td>
                            {`${a.user.firstName ?? ''} ${a.user.lastName ?? ''}`.trim() || 'Membre'}
                          </td>
                          <td className="text-02">{a.topic.label}</td>
                          <td>
                            <Tag tone={a.status === 'confirmed' ? 'green' : 'yellow'}>{a.status}</Tag>
                          </td>
                          {mayManageAppts && (
                            <td className="num">
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
    </>
  );
}
