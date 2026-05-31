import { useQuery } from '@tanstack/react-query';
import { Loading, InlineNotification } from '@carbon/react';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Empty, Tone } from '../components/ui';

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
  const { data, isLoading, error } = useQuery({
    queryKey: ['activity'],
    queryFn: async () =>
      (await api.get('/admin/activity', { params: { pageSize: 100 } })).data.data as ActivityRow[],
  });

  return (
    <>
      <PageHead title="Activité" subtitle="Journal des actions transverses de la plateforme" />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          <Panel title="Flux d'activité" sub={data ? `${data.length} entrées` : undefined}>
            {isLoading ? (
              <Loading withOverlay={false} />
            ) : error ? (
              <InlineNotification kind="error" title="Erreur de chargement" lowContrast />
            ) : data && data.length > 0 ? (
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
                  {data.map((a) => (
                    <tr key={a.id}>
                      <td className="text-mono">{new Date(a.createdAt).toLocaleString()}</td>
                      <td>
                        <Tag tone={kindTone(a.kind)}>{a.kind}</Tag>
                      </td>
                      <td>{a.actorLabel}</td>
                      <td style={{ color: 'var(--text-02)' }}>{a.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Empty>Aucune activité enregistrée</Empty>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
