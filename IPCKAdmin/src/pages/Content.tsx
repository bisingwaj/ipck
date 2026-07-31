import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal, TextInput, TextArea, Select, SelectItem, Toggle } from '@carbon/react';
import { Add, Edit, TrashCan, Video, Music, Microphone } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Tile, Empty, StatusBadge, CategoryBadge, categoryLabel, statusLabel, Thumb } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, DetailSection, DetailLead, Field, DetailText } from '../components/DetailPanel';
import { useAction } from '../api/useAction';
import { useAuth } from '../auth/AuthContext';
import { t, dateLocale } from '../i18n';

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
const statusHint = (s: string) =>
  ['published', 'draft', 'scheduled'].includes(s) ? t(`content.statusHint.${s}`) : undefined;

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
  if (!url) return t('content.errVideoRequired');
  const isAbsolute = /^https?:\/\/.+/i.test(url);
  const isHosted = url.startsWith('/media/');
  if (!isAbsolute && !isHosted) {
    return t('content.errVideoFormat');
  }
  return null;
}

/** Valide une vignette optionnelle (URL d'image absolue, si fournie). */
function validateThumbnail(raw?: string | null): string | null {
  const url = (raw ?? '').trim();
  if (!url) return null;
  if (!/^https?:\/\/.+/i.test(url)) return t('content.errThumb');
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
    successTitle: (_d, body) => (body.id ? t('content.updated') : t('content.created')),
    errorTitle: t('content.saveFailed'),
    onDone: () => {
      setOpen(false);
      setForm(EMPTY);
    },
  });

  const toggleLive = useAction<{ c: Content; isLive: boolean }>({
    mutationFn: ({ c, isLive }) => api.patch(`/content/${c.id}`, { isLive }),
    invalidate: [['admin-content'], ['live-current']],
    confirm: ({ c, isLive }) => ({
      title: isLive ? t('content.confirmGoLiveTitle') : t('content.confirmStopLiveTitle'),
      message: isLive
        ? t('content.confirmGoLiveMsg').replace('{title}', c.title)
        : t('content.confirmStopLiveMsg').replace('{title}', c.title),
      confirmLabel: isLive ? t('content.goLive') : t('content.stop'),
      danger: !isLive,
    }),
    successTitle: (_d, { isLive }) => (isLive ? t('content.liveOn') : t('content.liveOff')),
    errorTitle: t('content.toggleFailed'),
  });

  const remove = useAction<Content>({
    mutationFn: (c) => api.delete(`/content/${c.id}`),
    invalidate: [['admin-content'], ['live-current']],
    confirm: (c) => ({
      title: t('content.confirmDeleteTitle'),
      message: t('content.confirmDeleteMsg').replace('{title}', c.title),
      confirmLabel: t('content.delete'),
      danger: true,
    }),
    successTitle: t('content.deleted'),
    errorTitle: t('content.deleteFailed'),
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
  const titleError = form.title.trim() ? null : t('content.errTitleRequired');
  const videoError = validateVideoUrl(form.videoUrl);
  const thumbError = validateThumbnail(form.thumbnailUrl);
  const firstBlocker = titleError ?? videoError ?? thumbError;
  const canSave = !firstBlocker;

  return (
    <>
      <PageHead
        title={t('content.title')}
        subtitle={t('content.subtitle')}
        actions={
          mayManage ? (
            <button className="cds-btn cds-btn--md" onClick={openCreate}>
              {t('content.new')}
              <Add size={16} />
            </button>
          ) : undefined
        }
      />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          {/* Direct en cours */}
          <Panel title={t('content.live')} sub={t('content.liveSub')} actions={<FreshnessBadge query={live} />}>
            <QueryBoundary
              query={live}
              isEmpty={(d) => d === null}
              empty={<Empty>{t('content.liveEmpty')}</Empty>}
              loadingLabel={t('content.loadingLive')}
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
                        <Tag tone="red">{t('content.onAir')}</Tag>
                      ) : (
                        <span className="cds-live-head__state">{t('content.offline')}</span>
                      )}
                    </div>

                    {/* KPIs du live */}
                    <div
                      className="cds-grid"
                      style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
                    >
                      <Tile label={t('content.viewers')} value={session.viewersLive.toLocaleString()} live={isOn} />
                      <Tile label={t('content.peak')} value={session.viewersPeak.toLocaleString()} />
                      <Tile label={t('content.amens')} value={session.amenCount.toLocaleString()} />
                    </div>
                  </>
                );
              }}
            </QueryBoundary>
          </Panel>

          <Panel
            title={t('content.library')}
            sub={t('content.librarySub')}
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
                        {t('content.new')}
                        <Add size={16} />
                      </button>
                    ) : undefined
                  }
                >
                  {t('content.emptyLibrary')}
                </Empty>
              }
              loadingLabel={t('content.loadingLibrary')}
            >
              {(rows) => (
                <table className="cds-data-table cds-data-table--compact">
                  <thead>
                    <tr>
                      <th>{t('content.colTitle')}</th>
                      <th>{t('content.colCategory')}</th>
                      <th>{t('content.colStatus')}</th>
                      <th>{t('content.colLive')}</th>
                      {mayManage && <th className="num">{t('content.colActions')}</th>}
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
                                {c.featured && <Tag tone="purple">{t('content.featured')}</Tag>}
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
                            labelText={t('content.colLive')}
                            labelA={t('content.no')}
                            labelB={t('content.liveShort')}
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
                                title={t('content.edit')}
                                onClick={() => openEdit(c)}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                                title={t('content.delete')}
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
        className="cds-modal-lg"
        modalHeading={editingId ? t('content.editHeading') : t('content.newHeading')}
        modalLabel={t('content.modalLabel')}
        primaryButtonText={save.isPending ? t('content.saving') : t('content.save')}
        secondaryButtonText={t('content.cancel')}
        primaryButtonDisabled={!canSave || save.isPending}
        onRequestClose={() => setOpen(false)}
        onRequestSubmit={() => save.run(form)}
      >
        <div className="cds-form">
          {/* 1 · Identité */}
          <section className="cds-form__section">
            <div className="cds-form__legend">
              <span className="cds-form__legend-step">1</span>
              <span className="cds-form__legend-title">{t('content.identity')}</span>
            </div>
            <TextInput
              id="title"
              labelText={t('content.fieldTitle')}
              value={form.title}
              invalid={!!titleError}
              invalidText={titleError ?? undefined}
              onChange={(e) => set({ title: e.target.value })}
            />
            <div className="cds-form__row cds-form__row--2">
              <TextInput id="speaker" labelText={t('content.speaker')} value={form.speaker ?? ''} onChange={(e) => set({ speaker: e.target.value })} />
              <TextInput id="series" labelText={t('content.series')} value={form.series ?? ''} onChange={(e) => set({ series: e.target.value })} />
            </div>
            <TextArea id="description" labelText={t('content.description')} rows={3} value={form.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
          </section>

          {/* 2 · Média */}
          <section className="cds-form__section">
            <div className="cds-form__legend">
              <span className="cds-form__legend-step">2</span>
              <span className="cds-form__legend-title">{t('content.media')}</span>
              <span className="cds-form__legend-sub">{t('content.mediaSub')}</span>
            </div>
            <TextInput
              id="videoUrl"
              labelText={t('content.videoLink')}
              placeholder={t('content.videoLinkPlaceholder')}
              value={form.videoUrl}
              invalid={!!videoError}
              invalidText={videoError ?? undefined}
              onChange={(e) => set({ videoUrl: e.target.value })}
            />
            <div className="cds-form__row cds-form__row--2">
              <TextInput
                id="thumbnailUrl"
                labelText={t('content.thumbnail')}
                placeholder="https://…/cover.jpg"
                value={form.thumbnailUrl ?? ''}
                invalid={!!thumbError}
                invalidText={thumbError ?? undefined}
                onChange={(e) => set({ thumbnailUrl: e.target.value })}
              />
              <TextInput id="duration" labelText={t('content.duration')} value={form.duration ?? ''} onChange={(e) => set({ duration: e.target.value })} />
            </div>
          </section>

          {/* 3 · Classement & diffusion */}
          <section className="cds-form__section">
            <div className="cds-form__legend">
              <span className="cds-form__legend-step">3</span>
              <span className="cds-form__legend-title">{t('content.classifyBroadcast')}</span>
            </div>
            <div className="cds-form__row cds-form__row--2">
              <Select id="category" labelText={t('content.category')} value={form.category} onChange={(e) => set({ category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} text={categoryLabel(c)} />
                ))}
              </Select>
              <Select
                id="status"
                labelText={t('content.status')}
                helperText={statusHint(form.status)}
                value={form.status}
                onChange={(e) => set({ status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} text={statusLabel(s)} />
                ))}
              </Select>
            </div>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <Toggle id="isLive" labelText={t('content.type')} labelA={t('content.typeVideo')} labelB={t('content.typeLive')} toggled={!!form.isLive} onToggle={(c: boolean) => set({ isLive: c })} />
              <Toggle id="featured" labelText={t('content.setFeatured')} labelA={t('content.no')} labelB={t('content.yes')} toggled={!!form.featured} onToggle={(c: boolean) => set({ featured: c })} />
            </div>
          </section>

          {/* Aperçu de la carte (comme dans l'app) */}
          <section className="cds-form__section">
            <div className="cds-form__legend">
              <span className="cds-form__legend-title" style={{ color: 'var(--text-03)' }}>{t('content.preview')}</span>
            </div>
            <div className="cds-content-preview">
              <Thumb src={form.thumbnailUrl} icon={categoryIcon(form.category)} alt={form.title} />
              <div className="cds-content-preview__body">
                <div className="cds-content-preview__title">
                  {form.title.trim() || t('content.previewTitle')}
                  {form.featured && <Tag tone="purple">{t('content.featured')}</Tag>}
                  {form.isLive && <Tag tone="red">{t('content.onAir')}</Tag>}
                </div>
                {(form.speaker || form.series) && (
                  <div className="cds-content-preview__sub">
                    {[form.speaker, form.series].filter(Boolean).join(' · ')}
                  </div>
                )}
                <div className="cds-content-preview__badges">
                  <CategoryBadge category={form.category} />
                  <StatusBadge status={form.status} />
                  {form.duration && <span className="cds-content-preview__dur">{form.duration}</span>}
                </div>
              </div>
            </div>
          </section>

          {/* Principe 6 : on ne laisse jamais un bouton désactivé sans dire pourquoi. */}
          {firstBlocker && (
            <div className="cds-notification cds-notification--warn">
              <div className="cds-notification__body">{t('content.toSave')} {firstBlocker}</div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Détail contenu ── */}
      <DetailPanel
        open={!!detail}
        onClose={() => setDetail(null)}
        media={detail && <Thumb src={detail.thumbnailUrl} icon={categoryIcon(detail.category)} alt={detail.title} />}
        eyebrow={detail ? categoryLabel(detail.category) : t('content.eyebrow')}
        title={detail?.title ?? t('content.eyebrow')}
        subtitle={
          detail && (
            <>
              <CategoryBadge category={detail.category} />
              <StatusBadge status={detail.status} />
              {detail.isLive && <Tag tone="red">{t('content.onAir')}</Tag>}
              {detail.featured && <Tag tone="purple">{t('content.featured')}</Tag>}
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
                {t('content.delete')}
                <TrashCan size={16} />
              </button>
              <button
                className="cds-btn cds-btn--md"
                onClick={() => {
                  openEdit(detail);
                  setDetail(null);
                }}
              >
                {t('content.edit')}
                <Edit size={16} />
              </button>
            </>
          )
        }
      >
        {detail && (
          <>
            <DetailLead>
              {detail.isLive ? t('content.liveContent') : t('content.vod')} {t('content.ofCategory')}{' '}
              {categoryLabel(detail.category)} {t('content.categoryClose')}
              {detail.speaker ? `${t('content.presentedBy')} ${detail.speaker}` : ''}.{' '}
              {detail.status === 'published'
                ? t('content.publishedVisible')
                : detail.status === 'scheduled'
                  ? t('content.scheduledNotYet')
                  : t('content.draftHidden')}
            </DetailLead>

            <DetailSection title={t('content.description')}>
              <DetailText>{detail.description ?? ''}</DetailText>
            </DetailSection>

            <DetailSection title={t('content.info')}>
              <Field label={t('content.speaker')}>{detail.speaker || '—'}</Field>
              <Field label={t('content.series')}>{detail.series || '—'}</Field>
              <Field label={t('content.category')}>{categoryLabel(detail.category)}</Field>
              <Field label={t('content.duration')}>{detail.duration || '—'}</Field>
            </DetailSection>

            <DetailSection title={t('content.broadcast')}>
              <Field label={t('content.status')}>
                <StatusBadge status={detail.status} />
              </Field>
              <Field label={t('content.colLive')} hint={detail.isLive ? t('content.liveFlagHint') : undefined}>
                {detail.isLive ? t('content.yes') : t('content.no')}
              </Field>
              <Field label={t('content.featured')}>{detail.featured ? t('content.yes') : t('content.no')}</Field>
              <Field label={t('content.publishedOn')}>{new Date(detail.publishAt).toLocaleString(dateLocale())}</Field>
              <Field label={t('content.videoLinkField')}>
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
