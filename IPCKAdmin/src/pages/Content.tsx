import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal, TextInput, TextArea, Select, SelectItem, Toggle } from '@carbon/react';
import { Add, Edit, TrashCan, Video, Music, Microphone } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Tile, Empty, StatusBadge, CategoryBadge, categoryLabel, Thumb } from '../components/ui';
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

// Explique chaque statut pour que l'admin sache l'effet réel (pas de piège).
const STATUS_HINT: Record<string, string> = {
  published: 'Visible immédiatement dans l’app mobile des membres.',
  draft: 'Brouillon — invisible des membres tant qu’il n’est pas publié.',
  scheduled: 'Programmé — invisible jusqu’à publication manuelle.',
};

/** Icône de secours quand un contenu n'a pas de vignette (typée par catégorie). */
function categoryIcon(category: string) {
  if (category === 'podcast') return <Microphone size={18} />;
  if (category === 'worship') return <Music size={18} />;
  return <Video size={18} />;
}

/**
 * Le lecteur mobile (expo-video) lit : une URL absolue http(s) (MP4/HLS),
 * ou un chemin relatif auto-hébergé `/media/...`. On valide AVANT l'envoi
 * pour ne pas créer un contenu illisible silencieusement (vérité = ce que
 * le lecteur sait jouer).
 */
function validateVideoUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return 'Le lien vidéo est obligatoire.';
  const isAbsolute = /^https?:\/\/.+/i.test(url);
  const isHosted = url.startsWith('/media/');
  if (!isAbsolute && !isHosted) {
    return 'Entrez une URL http(s) (MP4/HLS) ou un chemin auto-hébergé commençant par /media/.';
  }
  return null;
}

/** Valide une vignette optionnelle (URL d'image absolue, si fournie). */
function validateThumbnail(raw?: string | null): string | null {
  const url = (raw ?? '').trim();
  if (!url) return null;
  if (!/^https?:\/\/.+/i.test(url)) return 'La vignette doit être une URL http(s).';
  return null;
}

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
      // On envoie des valeurs nettoyées (trim) — strictement les champs du DTO,
      // les optionnels vides deviennent `undefined` (jamais de chaîne vide en DB).
      const payload = {
        title: body.title.trim(),
        videoUrl: body.videoUrl.trim(),
        category: body.category,
        status: body.status,
        speaker: body.speaker?.trim() || undefined,
        series: body.series?.trim() || undefined,
        duration: body.duration?.trim() || undefined,
        description: body.description?.trim() || undefined,
        thumbnailUrl: body.thumbnailUrl?.trim() || undefined,
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

  // Validation centralisée : conditionne le bouton ET explique tout blocage.
  const titleError = form.title.trim() ? null : 'Le titre est obligatoire.';
  const videoError = validateVideoUrl(form.videoUrl);
  const thumbError = validateThumbnail(form.thumbnailUrl);
  const firstBlocker = titleError ?? videoError ?? thumbError;
  const canSave = !firstBlocker;

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
              {(session) => {
                if (!session) return null;
                const isOn = session.state === 'live';
                return (
                  <>
                    {/* En-tête : titre du live + état pulsant */}
                    <div className={'cds-live-head' + (isOn ? ' cds-live-head--on' : '')}>
                      <span
                        className={'cds-live-head__pulse' + (isOn ? '' : ' cds-live-head__pulse--off')}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="cds-live-head__title">{session.title}</div>
                        <div className="cds-live-head__meta">
                          {[session.speaker, session.series].filter(Boolean).join(' · ') || '—'}
                        </div>
                      </div>
                      {isOn ? (
                        <Tag tone="red">EN DIRECT</Tag>
                      ) : (
                        <span className="cds-live-head__state">Hors ligne</span>
                      )}
                    </div>

                    {/* KPIs du live */}
                    <div
                      className="cds-grid"
                      style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
                    >
                      <Tile label="Spectateurs" value={session.viewersLive.toLocaleString()} live={isOn} />
                      <Tile label="Pic d'audience" value={session.viewersPeak.toLocaleString()} />
                      <Tile label="Amens" value={session.amenCount.toLocaleString()} />
                    </div>
                  </>
                );
              }}
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
              empty={
                <Empty
                  icon={<Video size={20} />}
                  action={
                    mayManage ? (
                      <button className="cds-btn cds-btn--md" onClick={openCreate}>
                        Nouveau contenu
                        <Add size={16} />
                      </button>
                    ) : undefined
                  }
                >
                  Aucun contenu dans la bibliothèque.
                </Empty>
              }
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
                          <div className="cds-media-cell">
                            <Thumb src={c.thumbnailUrl} icon={categoryIcon(c.category)} alt={c.title} />
                            <div className="cds-media-cell__body">
                              <div className="cds-media-cell__title">
                                {c.title}
                                {c.featured && <Tag tone="purple">À la une</Tag>}
                              </div>
                              {(c.speaker || c.series) && (
                                <div className="cds-media-cell__sub">
                                  {[c.speaker, c.series].filter(Boolean).join(' · ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <CategoryBadge category={c.category} />
                        </td>
                        <td>
                          <StatusBadge status={c.status} />
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
          <TextInput
            id="title"
            labelText="Titre"
            value={form.title}
            invalid={!!titleError}
            invalidText={titleError ?? undefined}
            onChange={(e) => set({ title: e.target.value })}
          />
          <TextInput
            id="videoUrl"
            labelText="Lien vidéo (MP4 / HLS .m3u8) ou chemin auto-hébergé"
            placeholder="/media/videos/sunday-service.mp4  ou  https://…/stream.m3u8"
            value={form.videoUrl}
            invalid={!!videoError}
            invalidText={videoError ?? undefined}
            onChange={(e) => set({ videoUrl: e.target.value })}
          />
          <TextInput
            id="thumbnailUrl"
            labelText="Vignette (URL d'image, optionnel)"
            placeholder="https://…/cover.jpg"
            value={form.thumbnailUrl ?? ''}
            invalid={!!thumbError}
            invalidText={thumbError ?? undefined}
            onChange={(e) => set({ thumbnailUrl: e.target.value })}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select id="category" labelText="Catégorie" value={form.category} onChange={(e) => set({ category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} text={c} />
              ))}
            </Select>
            <Select
              id="status"
              labelText="Statut"
              helperText={STATUS_HINT[form.status]}
              value={form.status}
              onChange={(e) => set({ status: e.target.value })}
            >
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

          {/* Principe 6 : on ne laisse jamais un bouton désactivé sans dire pourquoi. */}
          {firstBlocker && (
            <div className="cds-notification cds-notification--warn">
              <div className="cds-notification__body">
                Pour enregistrer : {firstBlocker}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Détail contenu ── */}
      <DetailPanel
        open={!!detail}
        onClose={() => setDetail(null)}
        media={detail && <Thumb src={detail.thumbnailUrl} icon={categoryIcon(detail.category)} alt={detail.title} />}
        eyebrow={detail ? categoryLabel(detail.category) : 'Contenu'}
        title={detail?.title ?? 'Contenu'}
        subtitle={
          detail && (
            <>
              <CategoryBadge category={detail.category} />
              <StatusBadge status={detail.status} />
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
              catégorie « {categoryLabel(detail.category)} »
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
              <Field label="Catégorie">{categoryLabel(detail.category)}</Field>
              <Field label="Durée">{detail.duration || '—'}</Field>
            </DetailSection>

            <DetailSection title="Diffusion">
              <Field label="Statut">
                <StatusBadge status={detail.status} />
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
