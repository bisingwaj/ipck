import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal, TextInput, TextArea } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Empty } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, Field, DetailText } from '../components/DetailPanel';
import { useAction } from '../api/useAction';
import { useAuth } from '../auth/AuthContext';

interface Group {
  id: string;
  name: string;
  description?: string | null;
  members: number;
  leader: string;
  meets?: string | null;
}

interface EventRow {
  id: string;
  name: string;
  when: string;
  startsAt: string;
  loc?: string | null;
  cap?: number | null;
  rsvp: number;
}

export default function Community() {
  const { can } = useAuth();
  const mayManage = can('community.manage');
  const [groupOpen, setGroupOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [group, setGroup] = useState({ name: '', description: '', meets: '' });
  const [event, setEvent] = useState({ name: '', startsAt: '', location: '', capacity: '', description: '' });
  const [groupDetail, setGroupDetail] = useState<Group | null>(null);
  const [eventDetail, setEventDetail] = useState<EventRow | null>(null);

  const groups = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await api.get('/groups')).data as Group[],
  });
  const events = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get('/events')).data as EventRow[],
  });

  const createGroup = useAction<void>({
    mutationFn: () =>
      api.post('/groups', {
        name: group.name,
        description: group.description || undefined,
        meets: group.meets || undefined,
      }),
    invalidate: [['groups']],
    successTitle: 'Groupe créé',
    successSubtitle: () => group.name,
    errorTitle: 'La création a échoué',
    onDone: () => {
      setGroupOpen(false);
      setGroup({ name: '', description: '', meets: '' });
    },
  });

  const createEvent = useAction<void>({
    mutationFn: () =>
      api.post('/events', {
        name: event.name,
        startsAt: new Date(event.startsAt).toISOString(),
        location: event.location || undefined,
        capacity: event.capacity ? Number(event.capacity) : undefined,
        description: event.description || undefined,
      }),
    invalidate: [['events']],
    successTitle: 'Événement créé',
    successSubtitle: () => event.name,
    errorTitle: 'La création a échoué',
    onDone: () => {
      setEventOpen(false);
      setEvent({ name: '', startsAt: '', location: '', capacity: '', description: '' });
    },
  });

  // Validation locale du créneau (principe 2 : guider avant d'envoyer au serveur).
  const eventStartValid = !event.startsAt || !Number.isNaN(new Date(event.startsAt).getTime());
  const canCreateEvent = !!event.name.trim() && !!event.startsAt.trim() && eventStartValid;

  return (
    <>
      <PageHead title="Communauté" subtitle="Groupes de maison & événements de l'Église" />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          <div className="cds-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* Groupes */}
            <Panel
              title="Groupes"
              sub={groups.data ? `${groups.data.length} groupes` : undefined}
              actions={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <FreshnessBadge query={groups} />
                  {mayManage && (
                    <button className="cds-btn cds-btn--ghost cds-btn--sm" onClick={() => setGroupOpen(true)}>
                      Nouveau
                      <Add size={16} />
                    </button>
                  )}
                </span>
              }
            >
              <QueryBoundary
                query={groups}
                isEmpty={(d) => d.length === 0}
                empty={<Empty>Aucun groupe</Empty>}
                loadingLabel="Chargement des groupes…"
              >
                {(rows) => (
                  <table className="cds-data-table cds-data-table--compact">
                    <thead>
                      <tr>
                        <th>Groupe</th>
                        <th>Leader</th>
                        <th className="num">Membres</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((g) => (
                        <tr
                          key={g.id}
                          className="is-clickable"
                          tabIndex={0}
                          onClick={() => setGroupDetail(g)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setGroupDetail(g);
                            }
                          }}
                        >
                          <td>
                            <strong>{g.name}</strong>
                            {g.meets && <div className="cds-tile__caption" style={{ marginTop: 2 }}>{g.meets}</div>}
                          </td>
                          <td>{g.leader || '—'}</td>
                          <td className="num">{g.members}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </QueryBoundary>
            </Panel>

            {/* Événements */}
            <Panel
              title="Événements"
              sub={events.data ? `${events.data.length} planifiés` : undefined}
              actions={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <FreshnessBadge query={events} />
                  {mayManage && (
                    <button className="cds-btn cds-btn--ghost cds-btn--sm" onClick={() => setEventOpen(true)}>
                      Nouveau
                      <Add size={16} />
                    </button>
                  )}
                </span>
              }
            >
              <QueryBoundary
                query={events}
                isEmpty={(d) => d.length === 0}
                empty={<Empty>Aucun événement</Empty>}
                loadingLabel="Chargement des événements…"
              >
                {(rows) => (
                  <table className="cds-data-table cds-data-table--compact">
                    <thead>
                      <tr>
                        <th>Quand</th>
                        <th>Événement</th>
                        <th className="num">RSVP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((e) => (
                        <tr
                          key={e.id}
                          className="is-clickable"
                          tabIndex={0}
                          onClick={() => setEventDetail(e)}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                              ev.preventDefault();
                              setEventDetail(e);
                            }
                          }}
                        >
                          <td className="text-mono">{new Date(e.startsAt).toLocaleDateString()}</td>
                          <td>
                            <strong>{e.name}</strong>
                            {e.loc && <div className="cds-tile__caption" style={{ marginTop: 2 }}>{e.loc}</div>}
                          </td>
                          <td className="num">
                            {e.rsvp}
                            {e.cap ? <span className="text-05"> / {e.cap}</span> : null}
                          </td>
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

      {/* Modale groupe */}
      <Modal
        open={groupOpen}
        modalHeading="Nouveau groupe"
        primaryButtonText={createGroup.isPending ? 'Création…' : 'Créer'}
        secondaryButtonText="Annuler"
        primaryButtonDisabled={!group.name.trim() || createGroup.isPending}
        onRequestClose={() => setGroupOpen(false)}
        onRequestSubmit={() => createGroup.run()}
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <TextInput id="g-name" labelText="Nom" value={group.name} onChange={(e) => setGroup((g) => ({ ...g, name: e.target.value }))} />
          <TextInput id="g-meets" labelText="Rencontres (ex. Mardi 19h)" value={group.meets} onChange={(e) => setGroup((g) => ({ ...g, meets: e.target.value }))} />
          <TextArea id="g-desc" labelText="Description" rows={3} value={group.description} onChange={(e) => setGroup((g) => ({ ...g, description: e.target.value }))} />
        </div>
      </Modal>

      {/* Modale événement */}
      <Modal
        open={eventOpen}
        modalHeading="Nouvel événement"
        primaryButtonText={createEvent.isPending ? 'Création…' : 'Créer'}
        secondaryButtonText="Annuler"
        primaryButtonDisabled={!canCreateEvent || createEvent.isPending}
        onRequestClose={() => setEventOpen(false)}
        onRequestSubmit={() => createEvent.run()}
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <TextInput id="e-name" labelText="Nom" value={event.name} onChange={(e) => setEvent((v) => ({ ...v, name: e.target.value }))} />
          <TextInput
            id="e-start"
            labelText="Début (ex. 2026-06-15T18:00)"
            placeholder="AAAA-MM-JJTHH:MM"
            value={event.startsAt}
            invalid={!eventStartValid}
            invalidText="Date invalide — format AAAA-MM-JJTHH:MM"
            onChange={(e) => setEvent((v) => ({ ...v, startsAt: e.target.value }))}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <TextInput id="e-loc" labelText="Lieu" value={event.location} onChange={(e) => setEvent((v) => ({ ...v, location: e.target.value }))} />
            <TextInput id="e-cap" labelText="Capacité" value={event.capacity} onChange={(e) => setEvent((v) => ({ ...v, capacity: e.target.value }))} />
          </div>
          <TextArea id="e-desc" labelText="Description" rows={3} value={event.description} onChange={(e) => setEvent((v) => ({ ...v, description: e.target.value }))} />
        </div>
      </Modal>

      {/* ── Détail groupe ── */}
      <DetailPanel
        open={!!groupDetail}
        onClose={() => setGroupDetail(null)}
        title={groupDetail?.name ?? 'Groupe'}
      >
        {groupDetail && (
          <>
            <Field label="Leader">{groupDetail.leader || '—'}</Field>
            <Field label="Membres">{groupDetail.members}</Field>
            <Field label="Rencontres">{groupDetail.meets || '—'}</Field>
            {groupDetail.description && (
              <div style={{ marginTop: 'var(--spacing-04)' }}>
                <div className="cds-field__label" style={{ marginBottom: 'var(--spacing-03)' }}>
                  Description
                </div>
                <DetailText>{groupDetail.description}</DetailText>
              </div>
            )}
          </>
        )}
      </DetailPanel>

      {/* ── Détail événement ── */}
      <DetailPanel
        open={!!eventDetail}
        onClose={() => setEventDetail(null)}
        title={eventDetail?.name ?? 'Événement'}
      >
        {eventDetail && (
          <>
            <Field label="Quand">{new Date(eventDetail.startsAt).toLocaleString()}</Field>
            <Field label="Lieu">{eventDetail.loc || '—'}</Field>
            <Field label="RSVP">
              {eventDetail.rsvp}
              {eventDetail.cap ? ` / ${eventDetail.cap}` : ''}
            </Field>
          </>
        )}
      </DetailPanel>
    </>
  );
}
