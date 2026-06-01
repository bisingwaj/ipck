import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { UserMultiple, Money, VideoChat, Favorite, Book } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Tile, Panel, Meter } from '../components/ui';
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

// Référentiel des KPIs : libellé FR (le backend renvoie l'anglais), icône,
// page de détail, et format (monétaire ou nombre). Source unique côté front.
interface KpiMeta {
  label: string;
  icon: typeof Money;
  to?: string;
  money?: boolean;
}
const KPI_META: Record<string, KpiMeta> = {
  members: { label: 'Membres actifs', icon: UserMultiple, to: '/people' },
  giving: { label: 'Dons · ce mois-ci', icon: Money, to: '/giving', money: true },
  viewers: { label: 'Direct · pic du jour', icon: VideoChat, to: '/content' },
  prayers: { label: 'File de prières · en attente', icon: Favorite, to: '/care' },
  devo: { label: 'Complétion dévotion', icon: Book, to: '/devotions' },
};

// Métriques d'engagement : traduction par label backend connu.
const ENGAGEMENT_LABEL: Record<string, string> = {
  'Devotional completion': 'Complétion dévotion',
  'Members active 7d': 'Membres actifs (7 j)',
};

export default function Overview() {
  const navigate = useNavigate();
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
                {data.kpis.map((k) => {
                  const meta = KPI_META[k.id];
                  const Icon = meta?.icon;
                  const value = meta?.money
                    ? `$${k.value.toLocaleString('en-US')}`
                    : k.value.toLocaleString('fr-FR');
                  return (
                    <Tile
                      key={k.id}
                      label={meta?.label ?? k.label}
                      value={value}
                      live={k.live}
                      caption={k.live ? 'en direct' : meta?.to ? 'Voir le détail →' : undefined}
                      icon={Icon ? <Icon size={16} /> : undefined}
                      onClick={meta?.to ? () => navigate(meta.to!) : undefined}
                    />
                  );
                })}
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
                      {metrics.map((m) => {
                        const onTarget = m.pct >= m.target;
                        return (
                          <Tile
                            key={m.label}
                            label={ENGAGEMENT_LABEL[m.label] ?? m.label}
                            value={`${m.pct}%`}
                            delta={m.pct - m.target}
                            good
                            caption={`cible ${m.target}%`}
                          >
                            <Meter pct={m.pct} target={m.target} tone={onTarget ? 'green' : 'yellow'} />
                          </Tile>
                        );
                      })}
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
