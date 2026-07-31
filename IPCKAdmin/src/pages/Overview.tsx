import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { UserMultiple, Money, VideoChat, Favorite, Book } from '@carbon/icons-react';
import { api } from '../api/client';
import { useLang } from '../i18n';
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

// Référentiel des KPIs : clé i18n du libellé (le backend renvoie l'anglais),
// icône, page de détail, et format (monétaire ou nombre). Source unique front.
interface KpiMeta {
  labelKey: string;
  icon: typeof Money;
  to?: string;
  money?: boolean;
}
const KPI_META: Record<string, KpiMeta> = {
  members: { labelKey: 'kpi.members', icon: UserMultiple, to: '/people' },
  giving: { labelKey: 'kpi.giving', icon: Money, to: '/giving', money: true },
  viewers: { labelKey: 'kpi.viewers', icon: VideoChat, to: '/content' },
  prayers: { labelKey: 'kpi.prayers', icon: Favorite, to: '/care' },
  devo: { labelKey: 'kpi.devo', icon: Book, to: '/devotions' },
};

// Métriques d'engagement : clé i18n par label backend connu.
const ENGAGEMENT_KEY: Record<string, string> = {
  'Devotional completion': 'engagement.devotionalCompletion',
  'Members active 7d': 'engagement.membersActive7d',
};

export default function Overview() {
  const navigate = useNavigate();
  const { lang, t } = useLang();
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
        title={t('overview.title')}
        subtitle={t('overview.subtitle')}
        actions={<FreshnessBadge query={overview} />}
      />
      <div className="cds-tab-panel">
        <QueryBoundary query={overview} loadingLabel={t('overview.loadingKpis')}>
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
                  // Garde runtime : le backend peut renvoyer une valeur nulle.
                  const num = k.value ?? 0;
                  const value = meta?.money
                    ? `$${num.toLocaleString('en-US')}`
                    : num.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US');
                  return (
                    <Tile
                      key={k.id}
                      label={meta ? t(meta.labelKey) : k.label}
                      value={value}
                      live={k.live}
                      caption={
                        k.live ? t('overview.live') : meta?.to ? t('overview.seeDetail') : undefined
                      }
                      icon={Icon ? <Icon size={16} /> : undefined}
                      onClick={meta?.to ? () => navigate(meta.to!) : undefined}
                    />
                  );
                })}
              </div>

              <Panel
                title={t('overview.engagement')}
                sub={t('overview.engagementSub')}
                actions={<FreshnessBadge query={engagement} />}
              >
                <QueryBoundary
                  query={engagement}
                  isEmpty={(d) => d.length === 0}
                  empty={<p className="cds-tile__caption">{t('overview.engagementEmpty')}</p>}
                  loadingLabel={t('overview.loadingEngagement')}
                >
                  {(metrics) => (
                    <div
                      className="cds-grid"
                      style={{ gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, minmax(0, 1fr))` }}
                    >
                      {metrics.map((m) => {
                        // Gardes runtime contre des métriques partielles.
                        const pct = m.pct ?? 0;
                        const target = m.target ?? 0;
                        const onTarget = pct >= target;
                        return (
                          <Tile
                            key={m.label}
                            label={ENGAGEMENT_KEY[m.label] ? t(ENGAGEMENT_KEY[m.label]) : m.label}
                            value={`${pct}%`}
                            delta={pct - target}
                            good
                            caption={`${t('overview.target')} ${target}%`}
                          >
                            <Meter pct={pct} target={target} tone={onTarget ? 'green' : 'yellow'} />
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
