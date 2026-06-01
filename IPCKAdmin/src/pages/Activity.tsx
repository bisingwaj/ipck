import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Empty, Tone } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, Field, DetailText } from '../components/DetailPanel';

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
            <Field label="Type">{detail.kind}</Field>
            <Field label="Acteur">{detail.actorLabel}</Field>
            <Field label="Quand">{new Date(detail.createdAt).toLocaleString()}</Field>
            <div style={{ marginTop: 'var(--spacing-04)' }}>
              <div className="cds-field__label" style={{ marginBottom: 'var(--spacing-03)' }}>
                Description
              </div>
              <DetailText>{detail.description}</DetailText>
            </div>
          </>
        )}
      </DetailPanel>
    </>
  );
}
