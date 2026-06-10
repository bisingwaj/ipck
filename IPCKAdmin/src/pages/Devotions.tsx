import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Modal,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  DatePicker,
  DatePickerInput,
} from '@carbon/react';
import { Add, Book, Calendar } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Empty, StatusBadge, statusLabel } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, DetailSection, DetailLead, Field } from '../components/DetailPanel';
import { useAction } from '../api/useAction';
import { useAuth } from '../auth/AuthContext';
import { t, dateLocale } from '../i18n';

interface Devotional {
  id: string;
  date: string;
  title: string;
  verseRef: string;
  status: string;
  publishAt: string;
  author?: string | null;
}

interface Upcoming {
  type: string;
  title: string;
  when: string;
  author: string;
  status: string;
}

const STATUSES = ['published', 'draft', 'scheduled'];

// Effet réel de chaque statut, pour ne pas piéger l'admin.
const statusHint = (s: string) =>
  ['published', 'draft', 'scheduled'].includes(s) ? t(`devo.statusHint.${s}`) : undefined;

interface FormState {
  date: string;
  title: string;
  verseRef: string;
  verseText: string;
  body: string;
  prayer: string;
  applyTitle: string;
  applySteps: string;
  status: string;
  author: string;
  publishAt: string;
}

const EMPTY: FormState = {
  date: '',
  title: '',
  verseRef: '',
  verseText: '',
  body: '',
  prayer: '',
  applyTitle: '',
  applySteps: '',
  status: 'published',
  author: '',
  publishAt: '',
};

/** Découpe les étapes d'application (une par ligne) en tableau nettoyé. */
function parseSteps(raw: string): string[] {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Formate un Date local en `YYYY-MM-DD` (format attendu par le backend). */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Pastille de date dérivée de `publishAt` (ISO fiable) — corrige la colonne
 * Date du backend (texte libre qui dupliquait le verset). Marque "aujourd'hui".
 */
function DatePill({ iso }: { iso: string }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return <span className="cds-datepill"><span className="cds-datepill__day">—</span></span>;
  }
  const startOf = (x: Date) => {
    const c = new Date(x);
    c.setHours(0, 0, 0, 0);
    return c.getTime();
  };
  const isToday = startOf(d) === startOf(new Date());
  return (
    <span
      className={'cds-datepill' + (isToday ? ' cds-datepill--today' : '')}
      title={d.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
    >
      <span className="cds-datepill__day">{d.getDate()}</span>
      <span className="cds-datepill__mon">
        {d.toLocaleDateString(dateLocale(), { month: 'short' }).replace('.', '')}
      </span>
    </span>
  );
}

export default function Devotions() {
  const { can } = useAuth();
  const mayManage = can('devotionals.manage');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [detail, setDetail] = useState<Devotional | null>(null);

  const list = useQuery({
    queryKey: ['devotionals'],
    queryFn: async () =>
      (await api.get('/devotionals', { params: { pageSize: 100 } })).data.data as Devotional[],
  });
  const upcoming = useQuery({
    queryKey: ['content-upcoming'],
    queryFn: async () => (await api.get('/admin/content/upcoming')).data as Upcoming[],
  });

  const create = useAction<FormState>({
    mutationFn: (body) =>
      // Payload nettoyé, strictement conforme au CreateDevotionalDto.
      // publishAt/author optionnels → envoyés seulement si renseignés.
      api.post('/devotionals', {
        date: body.date.trim(),
        title: body.title.trim(),
        verseRef: body.verseRef.trim(),
        verseText: body.verseText.trim(),
        body: body.body.trim(),
        prayer: body.prayer.trim(),
        applyTitle: body.applyTitle.trim(),
        applySteps: parseSteps(body.applySteps),
        status: body.status,
        author: body.author.trim() || undefined,
        publishAt: body.publishAt ? new Date(body.publishAt).toISOString() : undefined,
      }),
    invalidate: [['devotionals'], ['content-upcoming']],
    successTitle: (_d, body) =>
      body.status === 'published' ? t('devo.published.toast') : t('devo.saved'),
    successSubtitle: (_d, body) => body.title.trim(),
    errorTitle: t('devo.saveFailed'),
    onDone: () => {
      setOpen(false);
      setForm(EMPTY);
    },
  });

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  // Validation centralisée : conditionne le bouton ET explique tout blocage
  // (principe 6 : rien de silencieux). Ordre = ordre des champs dans le form.
  const stepsCount = parseSteps(form.applySteps).length;
  const publishAtValid = !form.publishAt || !Number.isNaN(new Date(form.publishAt).getTime());
  const blocker: string | null =
    !form.date.trim()
      ? t('devo.errDate')
      : !form.title.trim()
        ? t('devo.errTitle')
        : !form.verseRef.trim()
          ? t('devo.errVerseRef')
          : !form.verseText.trim()
            ? t('devo.errVerseText')
            : !form.body.trim()
              ? t('devo.errBody')
              : !form.prayer.trim()
                ? t('devo.errPrayer')
                : !form.applyTitle.trim()
                  ? t('devo.errApplyTitle')
                  : parseSteps(form.applySteps).length === 0
                    ? t('devo.errSteps')
                    : form.status === 'scheduled' && !form.publishAt
                      ? t('devo.errScheduledNeedsDate')
                      : !publishAtValid
                        ? t('devo.errPublishInvalid')
                        : null;
  const canSave = !blocker;

  const devoUpcoming = upcoming.data?.filter((u) => u.type === 'Devotional') ?? [];

  return (
    <>
      <PageHead
        title={t('devo.title')}
        subtitle={t('devo.subtitle')}
        actions={
          mayManage ? (
            <button
              className="cds-btn cds-btn--md"
              onClick={() => {
                setForm(EMPTY);
                setOpen(true);
              }}
            >
              {t('devo.new')}
              <Add size={16} />
            </button>
          ) : undefined
        }
      />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          <div className="cds-split" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
            <Panel
              title={t('devo.published')}
              sub={list.data ? `${list.data.length} ${t('devo.devotionals')}` : undefined}
              actions={<FreshnessBadge query={list} />}
            >
              <QueryBoundary
                query={list}
                isEmpty={(d) => d.length === 0}
                empty={
                  <Empty
                    icon={<Book size={20} />}
                    action={
                      mayManage ? (
                        <button
                          className="cds-btn cds-btn--md"
                          onClick={() => {
                            setForm(EMPTY);
                            setOpen(true);
                          }}
                        >
                          {t('devo.new')}
                          <Add size={16} />
                        </button>
                      ) : undefined
                    }
                  >
                    {t('devo.emptyPublished')}
                  </Empty>
                }
                loadingLabel={t('devo.loading')}
              >
                {(rows) => (
                  <table className="cds-data-table">
                    <thead>
                      <tr>
                        <th>{t('devo.colDate')}</th>
                        <th>{t('devo.colDevotional')}</th>
                        <th>{t('devo.colVerse')}</th>
                        <th>{t('devo.colStatus')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((d) => (
                        <tr
                          key={d.id}
                          className="is-clickable"
                          tabIndex={0}
                          onClick={() => setDetail(d)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setDetail(d);
                            }
                          }}
                        >
                          <td>
                            <DatePill iso={d.publishAt} />
                          </td>
                          <td>
                            <div className="cds-devo-title">{d.title}</div>
                            {d.author && <div className="cds-devo-author">{d.author}</div>}
                          </td>
                          <td>
                            <span className="cds-verse-ref cds-verse-ref--sm">{d.verseRef}</span>
                          </td>
                          <td>
                            <StatusBadge status={d.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </QueryBoundary>
            </Panel>

            <Panel
              title={t('devo.upcoming')}
              sub={`${devoUpcoming.length} ${t('devo.scheduled')}`}
              actions={<FreshnessBadge query={upcoming} />}
            >
              <QueryBoundary
                query={upcoming}
                isEmpty={() => devoUpcoming.length === 0}
                empty={<Empty icon={<Calendar size={20} />}>{t('devo.emptyUpcoming')}</Empty>}
                loadingLabel={t('devo.loadingPlanning')}
              >
                {() => (
                  <table className="cds-data-table">
                    <thead>
                      <tr>
                        <th>{t('devo.colWhen')}</th>
                        <th>{t('devo.colTitle')}</th>
                        <th>{t('devo.colStatus')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devoUpcoming.map((u) => (
                        <tr key={`${u.type}-${u.when}-${u.title}`}>
                          <td>
                            <DatePill iso={u.when} />
                          </td>
                          <td>
                            <div className="cds-devo-title">{u.title}</div>
                          </td>
                          <td>
                            <StatusBadge status={u.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </QueryBoundary>
            </Panel>
          </div>
        </div>
      </div>

      <Modal
        open={open}
        className="cds-modal-lg"
        modalHeading={t('devo.modalHeading')}
        modalLabel={t('devo.modalLabel')}
        primaryButtonText={create.isPending ? t('devo.saving') : t('devo.save')}
        secondaryButtonText={t('devo.cancel')}
        primaryButtonDisabled={!canSave || create.isPending}
        onRequestClose={() => setOpen(false)}
        onRequestSubmit={() => create.run(form)}
      >
        <div className="cds-form">
          {/* 1 · Publication */}
          <section className="cds-form__section">
            <div className="cds-form__legend">
              <span className="cds-form__legend-step">1</span>
              <span className="cds-form__legend-title">{t('devo.publication')}</span>
              <span className="cds-form__legend-sub">{t('devo.publicationSub')}</span>
            </div>
            <div className="cds-form__row cds-form__row--2">
              <DatePicker
                datePickerType="single"
                dateFormat="Y-m-d"
                value={form.date || undefined}
                onChange={(dates: Date[]) =>
                  set({ date: dates[0] ? toISODate(dates[0]) : '' })
                }
              >
                <DatePickerInput
                  id="date"
                  labelText={t('devo.devoDate')}
                  placeholder="AAAA-MM-JJ"
                  invalid={!form.date.trim() && form.title.length > 0}
                  invalidText={t('devo.errDateShort')}
                />
              </DatePicker>
              <Select
                id="status"
                labelText={t('devo.status')}
                helperText={statusHint(form.status)}
                value={form.status}
                onChange={(e) => set({ status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} text={statusLabel(s)} />
                ))}
              </Select>
            </div>
            {form.status === 'scheduled' && (
              <TextInput
                id="publishAt"
                type="datetime-local"
                labelText={t('devo.scheduledPublish')}
                value={form.publishAt}
                invalid={!publishAtValid || !form.publishAt}
                invalidText={
                  !publishAtValid ? t('devo.invalidPublishDate') : t('devo.scheduledNeedsDate')
                }
                onChange={(e) => set({ publishAt: e.target.value })}
              />
            )}
          </section>

          {/* 2 · Écriture */}
          <section className="cds-form__section">
            <div className="cds-form__legend">
              <span className="cds-form__legend-step">2</span>
              <span className="cds-form__legend-title">{t('devo.scripture')}</span>
              <span className="cds-form__legend-sub">{t('devo.scriptureSub')}</span>
            </div>
            <div>
              <TextInput
                id="title"
                labelText={t('devo.fieldTitle')}
                maxLength={200}
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
              />
              <div className={'cds-countline' + (form.title.length > 180 ? ' cds-countline--warn' : '')}>
                {form.title.length}/200
              </div>
            </div>
            <div className="cds-form__row cds-form__row--ref">
              <TextInput id="verseRef" labelText={t('devo.reference')} placeholder={t('devo.referencePlaceholder')} value={form.verseRef} onChange={(e) => set({ verseRef: e.target.value })} />
              <TextInput id="verseText" labelText={t('devo.verseText')} value={form.verseText} onChange={(e) => set({ verseText: e.target.value })} />
            </div>

            {/* Aperçu éditorial vivant */}
            <div className="cds-verse-preview">
              <span className="cds-verse-preview__eyebrow">{t('devo.preview')}</span>
              {form.verseText.trim() || form.verseRef.trim() ? (
                <>
                  {form.verseText.trim() && (
                    <span className="cds-verse-preview__text">« {form.verseText.trim()} »</span>
                  )}
                  {form.verseRef.trim() && (
                    <span className="cds-verse-preview__ref">— {form.verseRef.trim()}</span>
                  )}
                </>
              ) : (
                <span className="cds-verse-preview__placeholder">{t('devo.versePlaceholder')}</span>
              )}
            </div>
          </section>

          {/* 3 · Méditation & prière */}
          <section className="cds-form__section">
            <div className="cds-form__legend">
              <span className="cds-form__legend-step">3</span>
              <span className="cds-form__legend-title">{t('devo.meditationPrayer')}</span>
            </div>
            <TextArea id="body" labelText={t('devo.meditation')} rows={5} value={form.body} onChange={(e) => set({ body: e.target.value })} />
            <TextArea id="prayer" labelText={t('devo.prayer')} rows={3} value={form.prayer} onChange={(e) => set({ prayer: e.target.value })} />
          </section>

          {/* 4 · Application */}
          <section className="cds-form__section">
            <div className="cds-form__legend">
              <span className="cds-form__legend-step">4</span>
              <span className="cds-form__legend-title">{t('devo.application')}</span>
              <span className="cds-form__legend-sub">{t('devo.applicationSub')}</span>
            </div>
            <TextInput id="applyTitle" labelText={t('devo.applyTitle')} value={form.applyTitle} onChange={(e) => set({ applyTitle: e.target.value })} />
            <div>
              <TextArea
                id="applySteps"
                labelText={t('devo.steps')}
                placeholder={t('devo.stepsPlaceholder')}
                rows={3}
                value={form.applySteps}
                onChange={(e) => set({ applySteps: e.target.value })}
              />
              <div className="cds-countline">
                {stepsCount === 0 ? t('devo.minStep') : `${stepsCount} ${t('devo.stepsDetected')}`}
              </div>
            </div>
            <TextInput
              id="author"
              labelText={t('devo.author')}
              placeholder={t('devo.authorPlaceholder')}
              value={form.author}
              onChange={(e) => set({ author: e.target.value })}
            />
          </section>

          {/* Principe 6 : pas de bouton désactivé sans explication. */}
          {blocker && (
            <div className="cds-notification cds-notification--warn">
              <div className="cds-notification__body">{t('devo.toSave')} {blocker}</div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Détail dévotion ── */}
      <DetailPanel
        open={!!detail}
        onClose={() => setDetail(null)}
        media={detail && <DatePill iso={detail.publishAt} />}
        eyebrow={t('devo.eyebrow')}
        title={detail?.title ?? t('devo.fallbackTitle')}
        subtitle={detail && <StatusBadge status={detail.status} />}
      >
        {detail && (
          <>
            <DetailLead>
              {t('devo.devotionalOf')} <strong>{detail.date}</strong>, {t('devo.anchoredOn')}{' '}
              <strong>{detail.verseRef}</strong>
              {detail.author ? `${t('devo.writtenBy')} ${detail.author}` : ''}.{' '}
              {detail.status === 'published'
                ? t('devo.publishedReadable')
                : detail.status === 'scheduled'
                  ? t('devo.scheduledNotYet')
                  : t('devo.draftHidden')}
            </DetailLead>

            <DetailSection title={t('devo.info')}>
              <Field label={t('devo.date')}>{detail.date}</Field>
              <Field label={t('devo.keyVerse')}>
                <span className="cds-verse-ref">{detail.verseRef}</span>
              </Field>
              <Field label={t('devo.authorField')}>{detail.author || '—'}</Field>
              <Field label={t('devo.colStatus')}>
                <StatusBadge status={detail.status} />
              </Field>
              <Field label={t('devo.publication.field')}>{new Date(detail.publishAt).toLocaleString(dateLocale())}</Field>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  );
}
