import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Empty, Tone } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, DetailSection, DetailLead, Field, DetailText } from '../components/DetailPanel';

interface ActivityRow {
  id: string;
  kind: string;
  actorLabel: string;
  description: string;
  createdAt: string;
}

const kindTone = (k: string): Tone => {
  if (k.includes('giving') || k.includes('donation')) return 'green';
  if (k.includes('prayer') || k.includes('care')) return 'magenta';
  if (k.includes('content') || k.includes('sermon')) return 'blue';
  if (k.includes('user') || k.includes('member')) return 'teal';
  return 'gray';
};

const KIND_DESC: Record<string, string> = {
  give: 'Un don a été effectué.',
  appts: 'Un rendez-vous pastoral a été pris ou modifié.',
  events: 'Un membre a répondu à un événement (RSVP).',
  broadcast: 'Une notification a été diffusée aux membres.',
  care: 'Action de soin pastoral (prière).',
  content: 'Contenu créé ou mis à jour.',
};
const kindDesc = (k: string) =>
  KIND_DESC[k] ?? 'Action enregistrée dans le journal de la plateforme.';

export default function Activity() {
  const [detail, setDetail] = useState<ActivityRow | null>(null);
  const activity = useQuery({
    queryKey: ['activity'],
    queryFn: async () =>
      (await api.get('/admin/activity', { params: { pageSize: 100 } })).data.data as ActivityRow[],
  });

  return (
    <>
      <PageHead title="Activité" subtitle="Journal des actions transverses de la plateforme" />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          <Panel
            title="Flux d'activité"
            sub={activity.data ? `${activity.data.length} entrées` : undefined}
            actions={<FreshnessBadge query={activity} />}
          >
            <QueryBoundary
              query={activity}
              isEmpty={(d) => d.length === 0}
              empty={<Empty>Aucune activité enregistrée</Empty>}
              loadingLabel="Chargement du journal…"
            >
              {(rows) => (
                <table className="cds-data-table">
                  <thead>
                    <tr>
                      <th>Quand</th>
                      <th>Type</th>
                      <th>Acteur</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a) => (
                      <tr
                        key={a.id}
                        className="is-clickable"
                        tabIndex={0}
                        onClick={() => setDetail(a)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setDetail(a);
                          }
                        }}
                      >
                        <td className="text-mono">{new Date(a.createdAt).toLocaleString()}</td>
                        <td>
                          <Tag tone={kindTone(a.kind)}>{a.kind}</Tag>
                        </td>
                        <td>{a.actorLabel}</td>
                        <td className="truncate" style={{ maxWidth: 360, color: 'var(--text-02)' }}>
                          {a.description}
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

      {/* ── Détail entrée d'activité ── */}
      <DetailPanel
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Entrée d'activité"
        subtitle={detail && <Tag tone={kindTone(detail.kind)}>{detail.kind}</Tag>}
      >
        {detail && (
          <>
            <DetailLead>
              <strong>{detail.actorLabel}</strong> —{' '}
              {new Date(detail.createdAt).toLocaleString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
              . {kindDesc(detail.kind)}
            </DetailLead>

            <DetailSection title="Détail de l'action">
              <DetailText>{detail.description}</DetailText>
            </DetailSection>

            <DetailSection title="Métadonnées">
              <Field label="Type" hint={kindDesc(detail.kind)}>
                <Tag tone={kindTone(detail.kind)}>{detail.kind}</Tag>
              </Field>
              <Field label="Acteur">{detail.actorLabel}</Field>
              <Field label="Horodatage">{new Date(detail.createdAt).toLocaleString('fr-FR')}</Field>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  );
}
