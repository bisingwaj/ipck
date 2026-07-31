import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Money,
  Favorite,
  Calendar,
  Send,
  VideoChat,
  Events,
  Activity as ActivityIcon,
} from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Empty } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, DetailSection, DetailLead, Field, DetailText } from '../components/DetailPanel';
import { t, dateLocale } from '../i18n';

interface ActivityRow {
  id: string;
  kind: string;
  actorLabel: string;
  description: string;
  createdAt: string;
}

type Tone = 'green' | 'magenta' | 'blue' | 'teal' | 'purple' | 'yellow' | 'gray';

/**
 * Référentiel des types d'événements réellement émis par le backend
 * (cf. activity.log dans les services) : give, prayer, appts, events,
 * broadcast, live. Chacun a une icône, un libellé humain et une couleur.
 */
interface KindMeta {
  label: string;
  tone: Tone;
  icon: typeof Money;
  desc: string;
}
// Icône/couleur par type ; libellé et description résolus via i18n.
const KIND_VISUAL: Record<string, { tone: Tone; icon: typeof Money }> = {
  give: { tone: 'green', icon: Money },
  prayer: { tone: 'magenta', icon: Favorite },
  appts: { tone: 'blue', icon: Calendar },
  events: { tone: 'teal', icon: Events },
  broadcast: { tone: 'purple', icon: Send },
  live: { tone: 'yellow', icon: VideoChat },
};
const metaFor = (k: string): KindMeta => {
  const v = KIND_VISUAL[k];
  if (!v) return { label: k, tone: 'gray', icon: ActivityIcon, desc: t('kind.fallback.desc') };
  return { label: t(`kind.${k}`), tone: v.tone, icon: v.icon, desc: t(`kind.${k}.desc`) };
};

/** Temps relatif court et humain ("à l'instant", "il y a 3 min", "hier"). */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('activity.justNow');
  if (min < 60) return t('activity.minAgo').replace('{n}', String(min));
  const h = Math.floor(min / 60);
  if (h < 24) return t('activity.hAgo').replace('{n}', String(h));
  const d = Math.floor(h / 24);
  if (d === 1) return t('activity.yesterday');
  if (d < 7) return t('activity.dAgo').replace('{n}', String(d));
  return new Date(iso).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' });
}

/** Clé de jour lisible pour les en-têtes ("Aujourd'hui", "Hier", date). */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const startOf = (x: Date) => {
    const c = new Date(x);
    c.setHours(0, 0, 0, 0);
    return c.getTime();
  };
  const diff = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000);
  if (diff === 0) return t('activity.today');
  if (diff === 1) return t('activity.yesterdayCap');
  return d.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Activity() {
  const [detail, setDetail] = useState<ActivityRow | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const activity = useQuery({
    queryKey: ['activity'],
    queryFn: async () =>
      (await api.get('/admin/activity', { params: { pageSize: 100 } })).data.data as ActivityRow[],
  });

  const open = (a: ActivityRow) => setDetail(a);

  return (
    <>
      <PageHead title={t('activity.title')} subtitle={t('activity.subtitle')} />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          <Panel
            title={t('activity.feed')}
            sub={activity.data ? `${activity.data.length} ${t('activity.entries')}` : undefined}
            actions={<FreshnessBadge query={activity} />}
          >
            <QueryBoundary
              query={activity}
              isEmpty={(d) => d.length === 0}
              empty={<Empty>{t('activity.empty')}</Empty>}
              loadingLabel={t('activity.loading')}
            >
              {(rows) => {
                // Comptes par type présents (pour les chips de filtre).
                const counts = rows.reduce<Record<string, number>>((acc, r) => {
                  acc[r.kind] = (acc[r.kind] ?? 0) + 1;
                  return acc;
                }, {});
                const presentKinds = Object.keys(counts).sort();
                const visible = filter === 'all' ? rows : rows.filter((r) => r.kind === filter);

                // Groupage par jour (les données arrivent déjà triées desc).
                const groups: { day: string; items: ActivityRow[] }[] = [];
                for (const r of visible) {
                  const day = dayLabel(r.createdAt);
                  const last = groups[groups.length - 1];
                  if (last && last.day === day) last.items.push(r);
                  else groups.push({ day, items: [r] });
                }

                return (
                  <>
                    {/* Filtres par type */}
                    <div className="cds-chips">
                      <button
                        className={'cds-chip' + (filter === 'all' ? ' is-active' : '')}
                        onClick={() => setFilter('all')}
                      >
                        {t('activity.all')} <span className="cds-chip__count">{rows.length}</span>
                      </button>
                      {presentKinds.map((k) => {
                        const m = metaFor(k);
                        const Icon = m.icon;
                        return (
                          <button
                            key={k}
                            className={'cds-chip' + (filter === k ? ' is-active' : '')}
                            onClick={() => setFilter(k)}
                          >
                            <Icon size={14} />
                            {m.label} <span className="cds-chip__count">{counts[k]}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Timeline groupée par jour */}
                    {groups.map((g) => (
                      <div key={g.day}>
                        <div className="cds-timeline__day">{g.day}</div>
                        <div className="cds-timeline">
                          {g.items.map((a) => {
                            const m = metaFor(a.kind);
                            const Icon = m.icon;
                            return (
                              <div
                                key={a.id}
                                className="cds-tl"
                                tabIndex={0}
                                onClick={() => open(a)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    open(a);
                                  }
                                }}
                              >
                                <div className="cds-tl__rail">
                                  <span className={`cds-tl__dot cds-tl__dot--${m.tone}`}>
                                    <Icon size={16} />
                                  </span>
                                </div>
                                <div className="cds-tl__body">
                                  <div className="cds-tl__head">
                                    <span className="cds-tl__kind">{m.label}</span>
                                    <span
                                      className="cds-tl__time"
                                      title={new Date(a.createdAt).toLocaleString(dateLocale())}
                                    >
                                      {relativeTime(a.createdAt)}
                                    </span>
                                  </div>
                                  <div className="cds-tl__desc">
                                    <span className="cds-tl__actor">{a.actorLabel}</span>{' '}
                                    {a.description}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {visible.length === 0 && <Empty>{t('activity.emptyFilter')}</Empty>}
                  </>
                );
              }}
            </QueryBoundary>
          </Panel>
        </div>
      </div>

      {/* ── Détail entrée d'activité ── */}
      <DetailPanel
        open={!!detail}
        onClose={() => setDetail(null)}
        media={
          detail &&
          (() => {
            const Icon = metaFor(detail.kind).icon;
            return (
              <span className={`cds-tl__dot cds-tl__dot--${metaFor(detail.kind).tone}`}>
                <Icon size={20} />
              </span>
            );
          })()
        }
        eyebrow={detail ? metaFor(detail.kind).label : t('activity.eyebrow')}
        title={detail?.actorLabel ?? t('activity.entry')}
      >
        {detail && (
          <>
            <DetailLead>
              <strong>{detail.actorLabel}</strong> —{' '}
              {new Date(detail.createdAt).toLocaleString(dateLocale(), {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
              . {metaFor(detail.kind).desc}
            </DetailLead>

            <DetailSection title={t('activity.actionDetail')}>
              <DetailText>{detail.description}</DetailText>
            </DetailSection>

            <DetailSection title={t('activity.metadata')}>
              <Field label={t('activity.type')} hint={metaFor(detail.kind).desc}>
                <Tag tone={metaFor(detail.kind).tone}>{metaFor(detail.kind).label}</Tag>
              </Field>
              <Field label={t('activity.actor')}>{detail.actorLabel}</Field>
              <Field label={t('activity.when')}>{relativeTime(detail.createdAt)}</Field>
              <Field label={t('activity.timestamp')}>{new Date(detail.createdAt).toLocaleString(dateLocale())}</Field>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  );
}
