import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loading, InlineNotification } from '@carbon/react';
import { Locked, Email, Checkmark, Close } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Empty } from '../components/ui';

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
  const qc = useQueryClient();

  const queue = useQuery({
    queryKey: ['prayer-queue'],
    queryFn: async () => (await api.get('/prayers/queue')).data.data as PrayerRow[],
  });
  const appts = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => (await api.get('/appointments')).data as Appointment[],
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.patch(`/prayers/${id}/status`, { status: 'approved' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prayer-queue'] }),
  });
  const respond = useMutation({
    mutationFn: (id: string) =>
      api.post(`/prayers/${id}/respond`, { message: 'Thank you — we are praying with you.' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prayer-queue'] }),
  });

  const setApptStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'confirmed' | 'cancelled' }) =>
      api.patch(`/appointments/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const visTone = (v: string) =>
    v === 'private' ? 'blue' : v === 'public' ? 'green' : 'gray';

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
              <div className="cds-notification__title">
                La confidentialité pastorale est active
              </div>
              <div className="cds-notification__body">
                Les demandes de prière privées sont protégées et exclues des analyses, exports
                et fonctions IA. Chaque accès est journalisé.
              </div>
            </div>
          </div>

          {/* Master / detail */}
          <div className="cds-split" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
            {/* File de prières */}
            <Panel
              title="File de prières"
              sub={queue.data ? `${queue.data.length} en attente` : undefined}
            >
              {queue.isLoading ? (
                <Loading withOverlay={false} />
              ) : queue.error ? (
                <InlineNotification kind="error" title="Erreur" lowContrast />
              ) : queue.data && queue.data.length > 0 ? (
                <table className="cds-data-table">
                  <thead>
                    <tr>
                      <th>Demandeur</th>
                      <th>Visibilité</th>
                      <th>Demande</th>
                      <th className="num">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.data.map((p) => (
                      <tr key={p.id}>
                        <td>{p.who}</td>
                        <td>
                          <Tag tone={visTone(p.visibility)}>{p.visibility}</Tag>
                        </td>
                        <td className="truncate" style={{ maxWidth: 280, color: 'var(--text-02)' }}>
                          {p.text}
                        </td>
                        <td className="num">
                          <div style={{ display: 'inline-flex', gap: 4 }}>
                            <button
                              className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                              title="Approuver"
                              onClick={() => approve.mutate(p.id)}
                            >
                              <Checkmark size={16} />
                            </button>
                            <button
                              className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                              title="Répondre"
                              onClick={() => respond.mutate(p.id)}
                            >
                              <Email size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Empty>File vide 🎉</Empty>
              )}
            </Panel>

            {/* Rendez-vous */}
            <Panel
              title="Rendez-vous"
              sub={appts.data ? `${appts.data.length} planifiés` : undefined}
            >
              {appts.isLoading ? (
                <Loading withOverlay={false} />
              ) : appts.data && appts.data.length > 0 ? (
                <table className="cds-data-table cds-data-table--compact">
                  <thead>
                    <tr>
                      <th>Quand</th>
                      <th>Membre</th>
                      <th>Sujet</th>
                      <th>Statut</th>
                      <th className="num">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appts.data.map((a) => (
                      <tr key={a.id}>
                        <td className="text-mono">{new Date(a.slotStart).toLocaleString()}</td>
                        <td>
                          {`${a.user.firstName ?? ''} ${a.user.lastName ?? ''}`.trim() || 'Membre'}
                        </td>
                        <td className="text-02">{a.topic.label}</td>
                        <td>
                          <Tag tone={a.status === 'confirmed' ? 'green' : 'yellow'}>
                            {a.status}
                          </Tag>
                        </td>
                        <td className="num">
                          <div style={{ display: 'inline-flex', gap: 4 }}>
                            {a.status !== 'confirmed' && (
                              <button
                                className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                                title="Confirmer"
                                disabled={setApptStatus.isPending}
                                onClick={() => setApptStatus.mutate({ id: a.id, status: 'confirmed' })}
                              >
                                <Checkmark size={16} />
                              </button>
                            )}
                            <button
                              className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                              title="Annuler"
                              style={{ color: 'var(--red-60)' }}
                              disabled={setApptStatus.isPending}
                              onClick={() => setApptStatus.mutate({ id: a.id, status: 'cancelled' })}
                            >
                              <Close size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Empty>Aucun rendez-vous</Empty>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
