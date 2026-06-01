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
const KIND: Record<string, KindMeta> = {
  give: { label: 'Don', tone: 'green', icon: Money, desc: 'Un don a été effectué vers un fonds.' },
  prayer: { label: 'Prière', tone: 'magenta', icon: Favorite, desc: 'Une demande de prière a été soumise.' },
  appts: { label: 'Rendez-vous', tone: 'blue', icon: Calendar, desc: 'Un rendez-vous pastoral a été pris ou modifié.' },
  events: { label: 'Événement', tone: 'teal', icon: Events, desc: 'Un membre a répondu à un événement (RSVP).' },
  broadcast: { label: 'Diffusion', tone: 'purple', icon: Send, desc: 'Une notification a été diffusée aux membres.' },
  live: { label: 'Direct', tone: 'yellow', icon: VideoChat, desc: 'Une session de culte en direct a changé d’état.' },
};
const metaFor = (k: string): KindMeta =>
  KIND[k] ?? { label: k, tone: 'gray', icon: ActivityIcon, desc: 'Action enregistrée dans le journal.' };

/** Temps relatif court et humain ("à l'instant", "il y a 3 min", "hier"). */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'hier';
  if (d < 7) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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
                        Tout <span className="cds-chip__count">{rows.length}</span>
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
                                      title={new Date(a.createdAt).toLocaleString('fr-FR')}
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

                    {visible.length === 0 && <Empty>Aucune entrée pour ce filtre.</Empty>}
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
        title="Entrée d'activité"
        subtitle={detail && <Tag tone={metaFor(detail.kind).tone}>{metaFor(detail.kind).label}</Tag>}
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
              . {metaFor(detail.kind).desc}
            </DetailLead>

            <DetailSection title="Détail de l'action">
              <DetailText>{detail.description}</DetailText>
            </DetailSection>

            <DetailSection title="Métadonnées">
              <Field label="Type" hint={metaFor(detail.kind).desc}>
                <Tag tone={metaFor(detail.kind).tone}>{metaFor(detail.kind).label}</Tag>
              </Field>
              <Field label="Acteur">{detail.actorLabel}</Field>
              <Field label="Quand">{relativeTime(detail.createdAt)}</Field>
              <Field label="Horodatage">{new Date(detail.createdAt).toLocaleString('fr-FR')}</Field>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  );
}
