import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loading,
  InlineNotification,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
  Button,
  Tag,
} from '@carbon/react';
import { api } from '../api/client';

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

  return (
    <div className="ipck-page">
      <h2>Soin pastoral</h2>

      <h3 style={{ marginTop: '1.5rem' }}>File de prières</h3>
      {queue.isLoading ? (
        <Loading withOverlay={false} />
      ) : queue.error ? (
        <InlineNotification kind="error" title="Erreur" lowContrast />
      ) : (
        <StructuredListWrapper>
          <StructuredListHead>
            <StructuredListRow head>
              <StructuredListCell head>Demandeur</StructuredListCell>
              <StructuredListCell head>Visibilité</StructuredListCell>
              <StructuredListCell head>Demande</StructuredListCell>
              <StructuredListCell head>Actions</StructuredListCell>
            </StructuredListRow>
          </StructuredListHead>
          <StructuredListBody>
            {queue.data?.map((p) => (
              <StructuredListRow key={p.id}>
                <StructuredListCell>{p.who}</StructuredListCell>
                <StructuredListCell>
                  <Tag type="cool-gray">{p.visibility}</Tag>
                </StructuredListCell>
                <StructuredListCell>{p.text}</StructuredListCell>
                <StructuredListCell>
                  <Button size="sm" kind="tertiary" onClick={() => approve.mutate(p.id)}>
                    Approuver
                  </Button>{' '}
                  <Button size="sm" kind="ghost" onClick={() => respond.mutate(p.id)}>
                    Répondre
                  </Button>
                </StructuredListCell>
              </StructuredListRow>
            ))}
            {queue.data?.length === 0 && (
              <StructuredListRow>
                <StructuredListCell>File vide 🎉</StructuredListCell>
              </StructuredListRow>
            )}
          </StructuredListBody>
        </StructuredListWrapper>
      )}

      <h3 style={{ marginTop: '2rem' }}>Rendez-vous</h3>
      {appts.isLoading ? (
        <Loading withOverlay={false} />
      ) : (
        <StructuredListWrapper>
          <StructuredListHead>
            <StructuredListRow head>
              <StructuredListCell head>Quand</StructuredListCell>
              <StructuredListCell head>Membre</StructuredListCell>
              <StructuredListCell head>Sujet</StructuredListCell>
              <StructuredListCell head>Statut</StructuredListCell>
            </StructuredListRow>
          </StructuredListHead>
          <StructuredListBody>
            {appts.data?.map((a) => (
              <StructuredListRow key={a.id}>
                <StructuredListCell>{new Date(a.slotStart).toLocaleString()}</StructuredListCell>
                <StructuredListCell>
                  {`${a.user.firstName ?? ''} ${a.user.lastName ?? ''}`.trim() || 'Membre'}
                </StructuredListCell>
                <StructuredListCell>{a.topic.label}</StructuredListCell>
                <StructuredListCell>
                  <Tag type={a.status === 'confirmed' ? 'green' : 'gray'}>{a.status}</Tag>
                </StructuredListCell>
              </StructuredListRow>
            ))}
          </StructuredListBody>
        </StructuredListWrapper>
      )}
    </div>
  );
}
