import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loading, InlineNotification, Modal, TextInput, TextArea } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Empty } from '../components/ui';

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
  const qc = useQueryClient();
  const [groupOpen, setGroupOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [group, setGroup] = useState({ name: '', description: '', meets: '' });
  const [event, setEvent] = useState({ name: '', startsAt: '', location: '', capacity: '', description: '' });

  const groups = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await api.get('/groups')).data as Group[],
  });
  const events = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get('/events')).data as EventRow[],
  });

  const createGroup = useMutation({
    mutationFn: () =>
      api.post('/groups', {
        name: group.name,
        description: group.description || undefined,
        meets: group.meets || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      setGroupOpen(false);
      setGroup({ name: '', description: '', meets: '' });
    },
  });

  const createEvent = useMutation({
    mutationFn: () =>
      api.post('/events', {
        name: event.name,
        startsAt: new Date(event.startsAt).toISOString(),
        location: event.location || undefined,
        capacity: event.capacity ? Number(event.capacity) : undefined,
        description: event.description || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      setEventOpen(false);
      setEvent({ name: '', startsAt: '', location: '', capacity: '', description: '' });
    },
  });

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
                <button className="cds-btn cds-btn--ghost cds-btn--sm" onClick={() => setGroupOpen(true)}>
                  Nouveau
                  <Add size={16} />
                </button>
              }
            >
              {groups.isLoading ? (
                <Loading withOverlay={false} />
              ) : groups.error ? (
                <InlineNotification kind="error" title="Erreur de chargement" lowContrast />
              ) : groups.data && groups.data.length > 0 ? (
                <table className="cds-data-table cds-data-table--compact">
                  <thead>
                    <tr>
                      <th>Groupe</th>
                      <th>Leader</th>
                      <th className="num">Membres</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.data.map((g) => (
                      <tr key={g.id}>
                        <td>
                          <strong>{g.name}</strong>
                          {g.meets && (
                            <div className="cds-tile__caption" style={{ marginTop: 2 }}>{g.meets}</div>
                          )}
                        </td>
                        <td>{g.leader || '—'}</td>
                        <td className="num">{g.members}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Empty>Aucun groupe</Empty>
              )}
            </Panel>

            {/* Événements */}
            <Panel
              title="Événements"
              sub={events.data ? `${events.data.length} planifiés` : undefined}
              actions={
                <button className="cds-btn cds-btn--ghost cds-btn--sm" onClick={() => setEventOpen(true)}>
                  Nouveau
                  <Add size={16} />
                </button>
              }
            >
              {events.isLoading ? (
                <Loading withOverlay={false} />
              ) : events.error ? (
                <InlineNotification kind="error" title="Erreur de chargement" lowContrast />
              ) : events.data && events.data.length > 0 ? (
                <table className="cds-data-table cds-data-table--compact">
                  <thead>
                    <tr>
                      <th>Quand</th>
                      <th>Événement</th>
                      <th className="num">RSVP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.data.map((e) => (
                      <tr key={e.id}>
                        <td className="text-mono">{new Date(e.startsAt).toLocaleDateString()}</td>
                        <td>
                          <strong>{e.name}</strong>
                          {e.loc && (
                            <div className="cds-tile__caption" style={{ marginTop: 2 }}>{e.loc}</div>
                          )}
                        </td>
                        <td className="num">
                          {e.rsvp}
                          {e.cap ? <span className="text-05"> / {e.cap}</span> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Empty>Aucun événement</Empty>
              )}
            </Panel>
          </div>
        </div>
      </div>

      {/* Modale groupe */}
      <Modal
        open={groupOpen}
        modalHeading="Nouveau groupe"
        primaryButtonText={createGroup.isPending ? 'Enregistrement…' : 'Créer'}
        secondaryButtonText="Annuler"
        primaryButtonDisabled={!group.name.trim() || createGroup.isPending}
        onRequestClose={() => setGroupOpen(false)}
        onRequestSubmit={() => createGroup.mutate()}
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          {createGroup.isError && <InlineNotification kind="error" title="Échec" lowContrast />}
          <TextInput id="g-name" labelText="Nom" value={group.name} onChange={(e) => setGroup((g) => ({ ...g, name: e.target.value }))} />
          <TextInput id="g-meets" labelText="Rencontres (ex. Mardi 19h)" value={group.meets} onChange={(e) => setGroup((g) => ({ ...g, meets: e.target.value }))} />
          <TextArea id="g-desc" labelText="Description" rows={3} value={group.description} onChange={(e) => setGroup((g) => ({ ...g, description: e.target.value }))} />
        </div>
      </Modal>

      {/* Modale événement */}
      <Modal
        open={eventOpen}
        modalHeading="Nouvel événement"
        primaryButtonText={createEvent.isPending ? 'Enregistrement…' : 'Créer'}
        secondaryButtonText="Annuler"
        primaryButtonDisabled={!event.name.trim() || !event.startsAt.trim() || createEvent.isPending}
        onRequestClose={() => setEventOpen(false)}
        onRequestSubmit={() => createEvent.mutate()}
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          {createEvent.isError && <InlineNotification kind="error" title="Échec" lowContrast />}
          <TextInput id="e-name" labelText="Nom" value={event.name} onChange={(e) => setEvent((v) => ({ ...v, name: e.target.value }))} />
          <TextInput id="e-start" labelText="Début (ex. 2026-06-15T18:00)" placeholder="AAAA-MM-JJTHH:MM" value={event.startsAt} onChange={(e) => setEvent((v) => ({ ...v, startsAt: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <TextInput id="e-loc" labelText="Lieu" value={event.location} onChange={(e) => setEvent((v) => ({ ...v, location: e.target.value }))} />
            <TextInput id="e-cap" labelText="Capacité" value={event.capacity} onChange={(e) => setEvent((v) => ({ ...v, capacity: e.target.value }))} />
          </div>
          <TextArea id="e-desc" labelText="Description" rows={3} value={event.description} onChange={(e) => setEvent((v) => ({ ...v, description: e.target.value }))} />
        </div>
      </Modal>
    </>
  );
}
