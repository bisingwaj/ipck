import { useQuery } from '@tanstack/react-query';
import { Loading, InlineNotification } from '@carbon/react';
import { api } from '../api/client';
import { PageHead, Tile, Panel } from '../components/ui';

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
      />
      <div className="cds-tab-panel">
        {overview.isLoading ? (
          <Loading withOverlay={false} />
        ) : overview.error ? (
          <InlineNotification kind="error" title="Erreur de chargement" lowContrast />
        ) : (
          <div className="cds-stack">
            <div
              className="cds-grid"
              style={{
                gridTemplateColumns: `repeat(${Math.min(
                  Math.max(overview.data?.kpis.length ?? 1, 1),
                  5,
                )}, minmax(0, 1fr))`,
              }}
            >
              {overview.data?.kpis.map((k) => (
                <Tile
                  key={k.id}
                  label={k.label}
                  value={k.value.toLocaleString()}
                  live={k.live}
                  caption={k.live ? 'en direct' : undefined}
                />
              ))}
            </div>

            <Panel title="Engagement" sub="Activité des membres sur 7 jours · vs cible">
              {engagement.isLoading ? (
                <Loading withOverlay={false} />
              ) : engagement.data && engagement.data.length > 0 ? (
                <div
                  className="cds-grid"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(engagement.data.length, 4)}, minmax(0, 1fr))`,
                  }}
                >
                  {engagement.data.map((m) => (
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
              ) : (
                <p className="cds-tile__caption">Aucune donnée d'engagement.</p>
              )}
            </Panel>
          </div>
        )}
      </div>
    </>
  );
}
