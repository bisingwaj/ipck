import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { PageHead, Tile, Panel } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';

interface Kpi {
  id: string;
  label: string;
  value: number;
  live?: boolean;
}

interface EngagementMetric {
  label: string;
  pct: number;
  target: number;
}

export default function Overview() {
  const overview = useQuery({
    queryKey: ['overview'],
    queryFn: async () => (await api.get('/admin/overview')).data as { kpis: Kpi[] },
  });
  const engagement = useQuery({
    queryKey: ['engagement'],
    queryFn: async () => (await api.get('/admin/engagement')).data as EngagementMetric[],
  });

  return (
    <>
      <PageHead
        title="Vue d'ensemble"
        subtitle="Indicateurs clés en direct · communauté, soin, dons & contenus"
        actions={<FreshnessBadge query={overview} />}
      />
      <div className="cds-tab-panel">
        <QueryBoundary query={overview} loadingLabel="Chargement des indicateurs…">
          {(data) => (
            <div className="cds-stack">
              <div
                className="cds-grid"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(Math.max(data.kpis.length, 1), 5)}, minmax(0, 1fr))`,
                }}
              >
                {data.kpis.map((k) => (
                  <Tile
                    key={k.id}
                    label={k.label}
                    value={k.value.toLocaleString()}
                    live={k.live}
                    caption={k.live ? 'en direct' : undefined}
                  />
                ))}
              </div>

              <Panel
                title="Engagement"
                sub="Activité des membres sur 7 jours · vs cible"
                actions={<FreshnessBadge query={engagement} />}
              >
                <QueryBoundary
                  query={engagement}
                  isEmpty={(d) => d.length === 0}
                  empty={<p className="cds-tile__caption">Aucune donnée d'engagement.</p>}
                  loadingLabel="Chargement de l'engagement…"
                >
                  {(metrics) => (
                    <div
                      className="cds-grid"
                      style={{ gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, minmax(0, 1fr))` }}
                    >
                      {metrics.map((m) => (
                        <Tile
                          key={m.label}
                          label={m.label}
                          value={`${m.pct}%`}
                          delta={m.pct - m.target}
                          good
                          caption={`cible ${m.target}%`}
                        />
                      ))}
                    </div>
                  )}
                </QueryBoundary>
              </Panel>
            </div>
          )}
        </QueryBoundary>
      </div>
    </>
  );
}
