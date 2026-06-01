import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal, TextInput, TextArea, Select, SelectItem, Toggle } from '@carbon/react';
import { Add, Edit, TrashCan } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Empty } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, DetailSection, DetailLead, Field, DetailText } from '../components/DetailPanel';
import { useAction } from '../api/useAction';
import { useAuth } from '../auth/AuthContext';

interface LiveSession {
  id: string;
  state: string;
  title: string;
  series?: string | null;
  speaker?: string | null;
  viewersLive: number;
  viewersPeak: number;
  amenCount: number;
}

interface Content {
  id: string;
  title: string;
  speaker?: string | null;
  series?: string | null;
  description?: string | null;
  category: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  duration?: string | null;
  isLive: boolean;
  featured: boolean;
  status: string;
  publishAt: string;
}

const CATEGORIES = ['sermon', 'podcast', 'teaching', 'worship', 'testimony', 'other'];
const STATUSES = ['published', 'draft', 'scheduled'];

type FormState = Partial<Content> & { title: string; videoUrl: string; category: string; status: string };

const EMPTY: FormState = {
  title: '',
  videoUrl: '',
  category: 'sermon',
  status: 'published',
  speaker: '',
  series: '',
  duration: '',
  description: '',
  isLive: false,
  featured: false,
};

export default function ContentPage() {
  const { can } = useAuth();
  const mayManage = can('content.manage');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [detail, setDetail] = useState<Content | null>(null);
  const editingId = form.id;

  const list = useQuery({
    queryKey: ['admin-content'],
    queryFn: async () =>
      (await api.get('/content/admin', { params: { pageSize: 100 } })).data.data as Content[],
  });
  const live = useQuery({
    queryKey: ['live-current'],
    queryFn: async () => (await api.get('/live/current')).data as LiveSession | null,
  });

  const save = useAction<FormState>({
    mutationFn: (body) => {
      const payload = {
        title: body.title,
        videoUrl: body.videoUrl,
        category: body.category,
        status: body.status,
        speaker: body.speaker || undefined,
        series: body.series || undefined,
        duration: body.duration || undefined,
        description: body.description || undefined,
        thumbnailUrl: body.thumbnailUrl || undefined,
        isLive: !!body.isLive,
        featured: !!body.featured,
      };
      return body.id ? api.patch(`/content/${body.id}`, payload) : api.post('/content', payload);
    },
    invalidate: [['admin-content'], ['live-current']],
    successTitle: (_d, body) => (body.id ? 'Contenu mis à jour' : 'Contenu créé'),
    errorTitle: "L'enregistrement a échoué",
    onDone: () => {
      setOpen(false);
      setForm(EMPTY);
    },
  });

  const toggleLive = useAction<{ c: Content; isLive: boolean }>({
    mutationFn: ({ c, isLive }) => api.patch(`/content/${c.id}`, { isLive }),
    invalidate: [['admin-content'], ['live-current']],
    confirm: ({ c, isLive }) => ({
      title: isLive ? 'Passer ce contenu en direct ?' : 'Arrêter le direct ?',
      message: isLive
        ? `« ${c.title} » sera signalé EN DIRECT dans l'app mobile des membres.`
        : `« ${c.title} » ne sera plus signalé en direct.`,
      confirmLabel: isLive ? 'Passer en direct' : 'Arrêter',
      danger: !isLive,
    }),
    successTitle: (_d, { isLive }) => (isLive ? 'Direct activé' : 'Direct arrêté'),
    errorTitle: 'Le changement a échoué',
  });

  const remove = useAction<Content>({
    mutationFn: (c) => api.delete(`/content/${c.id}`),
    invalidate: [['admin-content'], ['live-current']],
    confirm: (c) => ({
      title: 'Supprimer ce contenu ?',
      message: `« ${c.title} » sera définitivement retiré de l'app. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    }),
    successTitle: 'Contenu supprimé',
    errorTitle: 'La suppression a échoué',
    onDone: () => setDetail(null),
  });

  const openCreate = () => {
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (c: Content) => {
    setForm({
      id: c.id,
      title: c.title,
      videoUrl: c.videoUrl,
      category: c.category,
      status: c.status,
      speaker: c.speaker ?? '',
      series: c.series ?? '',
      duration: c.duration ?? '',
      description: c.description ?? '',
      thumbnailUrl: c.thumbnailUrl ?? '',
      isLive: c.isLive,
      featured: c.featured,
    });
    setOpen(true);
  };

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const canSave = !!form.title.trim() && !!form.videoUrl.trim();

  return (
    <>
      <PageHead
        title="Contenus"
        subtitle="Vidéos, sermons & directs · l'app se met à jour automatiquement"
        actions={
          mayManage ? (
            <button className="cds-btn cds-btn--md" onClick={openCreate}>
              Nouveau contenu
              <Add size={16} />
            </button>
          ) : undefined
        }
      />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          {/* Direct en cours */}
          <Panel title="Direct" sub="Session de culte en temps réel" actions={<FreshnessBadge query={live} />}>
            <QueryBoundary
              query={live}
              isEmpty={(d) => d === null}
              empty={<Empty>Aucune session live. Activez « En direct » sur un contenu ci-dessous.</Empty>}
              loadingLabel="Chargement du direct…"
            >
              {(session) =>
                session ? (
                  <div className="cds-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                    <div>
                      <div className="cds-tile__label">
                        <span>{session.title}</span>
                        {session.state === 'live' && <Tag tone="red">EN DIRECT</Tag>}
                      </div>
                      <div className="cds-tile__caption" style={{ marginTop: 2 }}>
                        {[session.speaker, session.series].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </div>
                    <div>
                      <div className="cds-tile__caption">Spectateurs</div>
                      <strong>{session.viewersLive.toLocaleString()}</strong>
                    </div>
                    <div>
                      <div className="cds-tile__caption">Pic</div>
                      <strong>{session.viewersPeak.toLocaleString()}</strong>
                    </div>
                    <div>
                      <div className="cds-tile__caption">Amens</div>
                      <strong>{session.amenCount.toLocaleString()}</strong>
                    </div>
                  </div>
                ) : null
              }
            </QueryBoundary>
          </Panel>

          <Panel
            title="Bibliothèque"
            sub="Collez un lien MP4 / flux HLS (.m3u8) ou un chemin auto-hébergé, choisissez la catégorie et activez le direct."
            actions={<FreshnessBadge query={list} />}
          >
            <QueryBoundary
              query={list}
              isEmpty={(d) => d.length === 0}
              empty={<Empty>Aucun contenu. Ajoutez-en un.</Empty>}
              loadingLabel="Chargement de la bibliothèque…"
            >
              {(rows) => (
                <table className="cds-data-table cds-data-table--compact">
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Catégorie</th>
                      <th>Statut</th>
                      <th>En direct</th>
                      {mayManage && <th className="num">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr
                        key={c.id}
                        className="is-clickable"
                        tabIndex={0}
                        onClick={() => setDetail(c)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setDetail(c);
                          }
                        }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong>{c.title}</strong>
                            {c.featured && <Tag tone="purple">À la une</Tag>}
                          </div>
                          {(c.speaker || c.series) && (
                            <div className="cds-tile__caption" style={{ marginTop: 2 }}>
                              {[c.speaker, c.series].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </td>
                        <td>
                          <Tag tone="gray">{c.category}</Tag>
                        </td>
                        <td>
                          <Tag tone={c.status === 'published' ? 'green' : 'yellow'}>{c.status}</Tag>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <Toggle
                            id={`live-${c.id}`}
                            size="sm"
                            hideLabel
                            labelText="En direct"
                            labelA="Non"
                            labelB="Live"
                            toggled={c.isLive}
                            disabled={!mayManage || toggleLive.isPending}
                            onToggle={(checked: boolean) => toggleLive.run({ c, isLive: checked })}
                          />
                        </td>
                        {mayManage && (
                          <td className="num" onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'inline-flex', gap: 4 }}>
                              <button
                                className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                                title="Éditer"
                                onClick={() => openEdit(c)}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                                title="Supprimer"
                                style={{ color: 'var(--red-60)' }}
                                disabled={remove.isPending}
                                onClick={() => remove.run(c)}
                              >
                                <TrashCan size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </QueryBoundary>
          </Panel>
        </div>
      </div>

      <Modal
        open={open}
        modalHeading={editingId ? 'Modifier le contenu' : 'Nouveau contenu'}
        primaryButtonText={save.isPending ? 'Enregistrement…' : 'Enregistrer'}
        secondaryButtonText="Annuler"
        primaryButtonDisabled={!canSave || save.isPending}
        onRequestClose={() => setOpen(false)}
        onRequestSubmit={() => save.run(form)}
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <TextInput id="title" labelText="Titre" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          <TextInput
            id="videoUrl"
            labelText="Lien vidéo (MP4 / HLS .m3u8) ou chemin auto-hébergé"
            placeholder="/media/videos/sunday-service.mp4  ou  https://…/stream.m3u8"
            value={form.videoUrl}
            onChange={(e) => set({ videoUrl: e.target.value })}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select id="category" labelText="Catégorie" value={form.category} onChange={(e) => set({ category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} text={c} />
              ))}
            </Select>
            <Select id="status" labelText="Statut" value={form.status} onChange={(e) => set({ status: e.target.value })}>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} text={s} />
              ))}
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <TextInput id="speaker" labelText="Intervenant" value={form.speaker ?? ''} onChange={(e) => set({ speaker: e.target.value })} />
            <TextInput id="series" labelText="Série" value={form.series ?? ''} onChange={(e) => set({ series: e.target.value })} />
          </div>
          <TextInput id="duration" labelText="Durée (ex. 38 min)" value={form.duration ?? ''} onChange={(e) => set({ duration: e.target.value })} />
          <TextArea id="description" labelText="Description" rows={3} value={form.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
          <div style={{ display: 'flex', gap: '2rem' }}>
            <Toggle id="isLive" labelText="Type : en direct" labelA="Vidéo" labelB="Live" toggled={!!form.isLive} onToggle={(c: boolean) => set({ isLive: c })} />
            <Toggle id="featured" labelText="Mettre à la une" labelA="Non" labelB="Oui" toggled={!!form.featured} onToggle={(c: boolean) => set({ featured: c })} />
          </div>
        </div>
      </Modal>

      {/* ── Détail contenu ── */}
      <DetailPanel
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title ?? 'Contenu'}
        subtitle={
          detail && (
            <>
              <Tag tone="gray">{detail.category}</Tag>
              <Tag tone={detail.status === 'published' ? 'green' : 'yellow'}>{detail.status}</Tag>
              {detail.isLive && <Tag tone="red">EN DIRECT</Tag>}
              {detail.featured && <Tag tone="purple">À la une</Tag>}
            </>
          )
        }
        footer={
          detail &&
          mayManage && (
            <>
              <button
                className="cds-btn cds-btn--danger cds-btn--md"
                disabled={remove.isPending}
                onClick={() => remove.run(detail)}
              >
                Supprimer
                <TrashCan size={16} />
              </button>
              <button
                className="cds-btn cds-btn--md"
                onClick={() => {
                  openEdit(detail);
                  setDetail(null);
                }}
              >
                Éditer
                <Edit size={16} />
              </button>
            </>
          )
        }
      >
        {detail && (
          <>
            <DetailLead>
              {detail.isLive ? 'Contenu diffusé en direct' : 'Vidéo à la demande'} de la
              catégorie « {detail.category} »
              {detail.speaker ? `, présenté par ${detail.speaker}` : ''}.{' '}
              {detail.status === 'published'
                ? 'Publié et visible dans l’app mobile.'
                : detail.status === 'scheduled'
                  ? 'Programmé — pas encore visible.'
                  : 'Brouillon — non visible des membres.'}
            </DetailLead>

            <DetailSection title="Description">
              <DetailText>{detail.description ?? ''}</DetailText>
            </DetailSection>

            <DetailSection title="Informations">
              <Field label="Intervenant">{detail.speaker || '—'}</Field>
              <Field label="Série">{detail.series || '—'}</Field>
              <Field label="Catégorie">{detail.category}</Field>
              <Field label="Durée">{detail.duration || '—'}</Field>
            </DetailSection>

            <DetailSection title="Diffusion">
              <Field label="Statut">
                <Tag tone={detail.status === 'published' ? 'green' : 'yellow'}>{detail.status}</Tag>
              </Field>
              <Field label="En direct" hint={detail.isLive ? 'Signalé EN DIRECT dans l’app.' : undefined}>
                {detail.isLive ? 'Oui' : 'Non'}
              </Field>
              <Field label="À la une">{detail.featured ? 'Oui' : 'Non'}</Field>
              <Field label="Publié le">{new Date(detail.publishAt).toLocaleString('fr-FR')}</Field>
              <Field label="Lien vidéo">
                <span className="text-mono" style={{ wordBreak: 'break-all' }}>
                  {detail.videoUrl}
                </span>
              </Field>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  );
}
