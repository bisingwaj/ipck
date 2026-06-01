import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal, TextInput, TextArea, Select, SelectItem } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Empty } from '../components/ui';
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
                empty={<Empty>Aucune dévotion. Ajoutez-en une.</Empty>}
                loadingLabel="Chargement des dévotions…"
              >
                {(rows) => (
                  <table className="cds-data-table cds-data-table--compact">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Titre</th>
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
                          <td className="text-mono">{d.date}</td>
                          <td>
                            <strong>{d.title}</strong>
                            {d.author && (
                              <div className="cds-tile__caption" style={{ marginTop: 2 }}>
                                {d.author}
                              </div>
                            )}
                          </td>
                          <td className="text-mono">{d.verseRef}</td>
                          <td>
                            <Tag tone={d.status === 'published' ? 'green' : 'yellow'}>{d.status}</Tag>
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
                empty={<Empty>Rien de planifié</Empty>}
                loadingLabel="Chargement du planning…"
              >
                {() => (
                  <table className="cds-data-table cds-data-table--compact">
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
                          <td className="text-mono">{new Date(u.when).toLocaleDateString()}</td>
                          <td>{u.title}</td>
                          <td>
                            <Tag tone="yellow">{u.status}</Tag>
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
        modalHeading="Nouvelle dévotion"
        primaryButtonText={create.isPending ? 'Enregistrement…' : 'Enregistrer'}
        secondaryButtonText="Annuler"
        primaryButtonDisabled={!canSave || create.isPending}
        onRequestClose={() => setOpen(false)}
        onRequestSubmit={() => create.run(form)}
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <TextInput
              id="date"
              labelText="Date affichée (ex. 2026-06-01)"
              value={form.date}
              invalid={!form.date.trim() && form.title.length > 0}
              invalidText="La date est obligatoire."
              onChange={(e) => set({ date: e.target.value })}
            />
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
              labelText="Publication programmée (AAAA-MM-JJTHH:MM)"
              placeholder="2026-06-15T06:00"
              value={form.publishAt}
              invalid={!publishAtValid || (form.status === 'scheduled' && !form.publishAt)}
              invalidText={
                !publishAtValid
                  ? 'Date de publication invalide.'
                  : 'Une dévotion programmée exige une date de publication.'
              }
              onChange={(e) => set({ publishAt: e.target.value })}
            />
          )}
          <TextInput id="title" labelText="Titre" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <TextInput id="verseRef" labelText="Référence (ex. Jean 3:16)" value={form.verseRef} onChange={(e) => set({ verseRef: e.target.value })} />
            <TextInput id="verseText" labelText="Texte du verset" value={form.verseText} onChange={(e) => set({ verseText: e.target.value })} />
          </div>
          <TextArea id="body" labelText="Méditation" rows={4} value={form.body} onChange={(e) => set({ body: e.target.value })} />
          <TextArea id="prayer" labelText="Prière" rows={2} value={form.prayer} onChange={(e) => set({ prayer: e.target.value })} />
          <TextInput id="applyTitle" labelText="Titre de l'application" value={form.applyTitle} onChange={(e) => set({ applyTitle: e.target.value })} />
          <TextArea
            id="applySteps"
            labelText="Étapes d'application — une par ligne (au moins une)"
            rows={3}
            value={form.applySteps}
            onChange={(e) => set({ applySteps: e.target.value })}
          />
          <TextInput
            id="author"
            labelText="Auteur (optionnel)"
            value={form.author}
            onChange={(e) => set({ author: e.target.value })}
          />

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
        subtitle={
          detail && (
            <Tag tone={detail.status === 'published' ? 'green' : 'yellow'}>{detail.status}</Tag>
          )
        }
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
              <Field label="Verset clé">{detail.verseRef}</Field>
              <Field label="Auteur">{detail.author || '—'}</Field>
              <Field label="Statut">
                <Tag tone={detail.status === 'published' ? 'green' : 'yellow'}>{detail.status}</Tag>
              </Field>
              <Field label="Publication">{new Date(detail.publishAt).toLocaleString('fr-FR')}</Field>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  );
}
