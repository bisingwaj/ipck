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
import { PageHead, Panel, Empty, StatusBadge } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, DetailSection, DetailLead, Field } from '../components/DetailPanel';
import { useAction } from '../api/useAction';
import { useAuth } from '../auth/AuthContext';

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
const STATUS_HINT: Record<string, string> = {
  published: 'Visible par les membres selon la date de publication.',
  draft: 'Brouillon — invisible des membres tant qu’il n’est pas publié.',
  scheduled: 'Programmé — nécessite une date/heure de publication ci-dessous.',
};

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
      title={d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
    >
      <span className="cds-datepill__day">{d.getDate()}</span>
      <span className="cds-datepill__mon">
        {d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
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
      body.status === 'published' ? 'Dévotion publiée' : 'Dévotion enregistrée',
    successSubtitle: (_d, body) => body.title.trim(),
    errorTitle: "L'enregistrement a échoué",
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
      ? 'La date est obligatoire (ex. 2026-06-01).'
      : !form.title.trim()
        ? 'Le titre est obligatoire.'
        : !form.verseRef.trim()
          ? 'La référence du verset est obligatoire.'
          : !form.verseText.trim()
            ? 'Le texte du verset est obligatoire.'
            : !form.body.trim()
              ? 'La méditation est obligatoire.'
              : !form.prayer.trim()
                ? 'La prière est obligatoire.'
                : !form.applyTitle.trim()
                  ? "Le titre de l'application est obligatoire."
                  : parseSteps(form.applySteps).length === 0
                    ? "Ajoutez au moins une étape d'application (une par ligne)."
                    : form.status === 'scheduled' && !form.publishAt
                      ? 'Un statut « programmé » exige une date/heure de publication.'
                      : !publishAtValid
                        ? 'La date de publication est invalide.'
                        : null;
  const canSave = !blocker;

  const devoUpcoming = upcoming.data?.filter((u) => u.type === 'Devotional') ?? [];

  return (
    <>
      <PageHead
        title="Dévotions"
        subtitle="Dévotion quotidienne · verset, méditation, prière & application"
        actions={
          mayManage ? (
            <button
              className="cds-btn cds-btn--md"
              onClick={() => {
                setForm(EMPTY);
                setOpen(true);
              }}
            >
              Nouvelle dévotion
              <Add size={16} />
            </button>
          ) : undefined
        }
      />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          <div className="cds-split" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
            <Panel
              title="Publiées"
              sub={list.data ? `${list.data.length} dévotions` : undefined}
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
                          Nouvelle dévotion
                          <Add size={16} />
                        </button>
                      ) : undefined
                    }
                  >
                    Aucune dévotion publiée pour le moment.
                  </Empty>
                }
                loadingLabel="Chargement des dévotions…"
              >
                {(rows) => (
                  <table className="cds-data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Dévotion</th>
                        <th>Verset</th>
                        <th>Statut</th>
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
              title="À venir"
              sub={`${devoUpcoming.length} planifiées`}
              actions={<FreshnessBadge query={upcoming} />}
            >
              <QueryBoundary
                query={upcoming}
                isEmpty={() => devoUpcoming.length === 0}
                empty={<Empty icon={<Calendar size={20} />}>Aucune dévotion programmée.</Empty>}
                loadingLabel="Chargement du planning…"
              >
                {() => (
                  <table className="cds-data-table">
                    <thead>
                      <tr>
                        <th>Quand</th>
                        <th>Titre</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devoUpcoming.map((u, i) => (
                        <tr key={i}>
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
        modalHeading="Nouvelle dévotion"
        modalLabel="Today · dévotion quotidienne"
        primaryButtonText={create.isPending ? 'Enregistrement…' : 'Enregistrer'}
        secondaryButtonText="Annuler"
        primaryButtonDisabled={!canSave || create.isPending}
        onRequestClose={() => setOpen(false)}
        onRequestSubmit={() => create.run(form)}
      >
        <div className="cds-form">
          {/* 1 · Publication */}
          <section className="cds-form__section">
            <div className="cds-form__legend">
              <span className="cds-form__legend-step">1</span>
              <span className="cds-form__legend-title">Publication</span>
              <span className="cds-form__legend-sub">Quand et comment elle paraît</span>
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
                  labelText="Date de la dévotion"
                  placeholder="AAAA-MM-JJ"
                  invalid={!form.date.trim() && form.title.length > 0}
                  invalidText="La date est obligatoire."
                />
              </DatePicker>
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
            {form.status === 'scheduled' && (
              <TextInput
                id="publishAt"
                type="datetime-local"
                labelText="Publication programmée"
                value={form.publishAt}
                invalid={!publishAtValid || !form.publishAt}
                invalidText={
                  !publishAtValid
                    ? 'Date de publication invalide.'
                    : 'Une dévotion programmée exige une date de publication.'
                }
                onChange={(e) => set({ publishAt: e.target.value })}
              />
            )}
          </section>

          {/* 2 · Écriture */}
          <section className="cds-form__section">
            <div className="cds-form__legend">
              <span className="cds-form__legend-step">2</span>
              <span className="cds-form__legend-title">Écriture</span>
              <span className="cds-form__legend-sub">Le verset du jour</span>
            </div>
            <div>
              <TextInput
                id="title"
                labelText="Titre"
                maxLength={200}
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
              />
              <div className={'cds-countline' + (form.title.length > 180 ? ' cds-countline--warn' : '')}>
                {form.title.length}/200
              </div>
            </div>
            <div className="cds-form__row cds-form__row--ref">
              <TextInput id="verseRef" labelText="Référence" placeholder="ex. Jean 3:16" value={form.verseRef} onChange={(e) => set({ verseRef: e.target.value })} />
              <TextInput id="verseText" labelText="Texte du verset" value={form.verseText} onChange={(e) => set({ verseText: e.target.value })} />
            </div>

            {/* Aperçu éditorial vivant */}
            <div className="cds-verse-preview">
              <span className="cds-verse-preview__eyebrow">Aperçu</span>
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
                <span className="cds-verse-preview__placeholder">
                  Le verset s'affichera ici, tel que les membres le verront.
                </span>
              )}
            </div>
          </section>

          {/* 3 · Méditation & prière */}
          <section className="cds-form__section">
            <div className="cds-form__legend">
              <span className="cds-form__legend-step">3</span>
              <span className="cds-form__legend-title">Méditation &amp; prière</span>
            </div>
            <TextArea id="body" labelText="Méditation" rows={5} value={form.body} onChange={(e) => set({ body: e.target.value })} />
            <TextArea id="prayer" labelText="Prière" rows={3} value={form.prayer} onChange={(e) => set({ prayer: e.target.value })} />
          </section>

          {/* 4 · Application */}
          <section className="cds-form__section">
            <div className="cds-form__legend">
              <span className="cds-form__legend-step">4</span>
              <span className="cds-form__legend-title">Application</span>
              <span className="cds-form__legend-sub">Mettre en pratique</span>
            </div>
            <TextInput id="applyTitle" labelText="Titre de l'application" value={form.applyTitle} onChange={(e) => set({ applyTitle: e.target.value })} />
            <div>
              <TextArea
                id="applySteps"
                labelText="Étapes — une par ligne"
                placeholder={'Relire le verset à voix haute\nPrier pour une personne précise\nNoter une action concrète'}
                rows={3}
                value={form.applySteps}
                onChange={(e) => set({ applySteps: e.target.value })}
              />
              <div className="cds-countline">
                {stepsCount === 0 ? 'Au moins une étape requise' : `${stepsCount} étape(s) détectée(s)`}
              </div>
            </div>
            <TextInput
              id="author"
              labelText="Auteur (optionnel)"
              placeholder="ex. Pasteur Joseph"
              value={form.author}
              onChange={(e) => set({ author: e.target.value })}
            />
          </section>

          {/* Principe 6 : pas de bouton désactivé sans explication. */}
          {blocker && (
            <div className="cds-notification cds-notification--warn">
              <div className="cds-notification__body">Pour enregistrer : {blocker}</div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Détail dévotion ── */}
      <DetailPanel
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title ?? 'Dévotion'}
        subtitle={detail && <StatusBadge status={detail.status} />}
      >
        {detail && (
          <>
            <DetailLead>
              Dévotion du <strong>{detail.date}</strong>, ancrée sur{' '}
              <strong>{detail.verseRef}</strong>
              {detail.author ? `, rédigée par ${detail.author}` : ''}.{' '}
              {detail.status === 'published'
                ? 'Publiée et lisible par les membres.'
                : detail.status === 'scheduled'
                  ? 'Programmée — pas encore visible.'
                  : 'Brouillon — non visible des membres.'}
            </DetailLead>

            <DetailSection title="Informations">
              <Field label="Date">{detail.date}</Field>
              <Field label="Verset clé">
                <span className="cds-verse-ref">{detail.verseRef}</span>
              </Field>
              <Field label="Auteur">{detail.author || '—'}</Field>
              <Field label="Statut">
                <StatusBadge status={detail.status} />
              </Field>
              <Field label="Publication">{new Date(detail.publishAt).toLocaleString('fr-FR')}</Field>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  );
}
