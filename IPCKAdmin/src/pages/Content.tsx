import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loading,
  InlineNotification,
  Toggle,
  Modal,
  TextInput,
  TextArea,
  Select,
  SelectItem,
} from '@carbon/react';
import { Add, Edit, TrashCan } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Empty } from '../components/ui';

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
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const editingId = form.id;

  const list = useQuery({
    queryKey: ['admin-content'],
    queryFn: async () => (await api.get('/content/admin', { params: { pageSize: 100 } })).data.data as Content[],
  });

  const live = useQuery({
    queryKey: ['live-current'],
    queryFn: async () => (await api.get('/live/current')).data as LiveSession | null,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-content'] });

  const save = useMutation({
    mutationFn: (body: FormState) => {
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
    onSuccess: () => { invalidate(); setOpen(false); setForm(EMPTY); },
  });

  const toggleLive = useMutation({
    mutationFn: ({ id, isLive }: { id: string; isLive: boolean }) => api.patch(`/content/${id}`, { isLive }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/content/${id}`),
    onSuccess: invalidate,
  });

  const openCreate = () => { setForm(EMPTY); setOpen(true); };
  const openEdit = (c: Content) => {
    setForm({
      id: c.id, title: c.title, videoUrl: c.videoUrl, category: c.category, status: c.status,
      speaker: c.speaker ?? '', series: c.series ?? '', duration: c.duration ?? '',
      description: c.description ?? '', thumbnailUrl: c.thumbnailUrl ?? '',
      isLive: c.isLive, featured: c.featured,
    });
    setOpen(true);
  };

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const canSave = form.title.trim() && form.videoUrl.trim();

  return (
    <>
      <PageHead
        title="Contenus"
        subtitle="Vidéos, sermons & directs · l'app se met à jour automatiquement"
        actions={
          <button className="cds-btn cds-btn--md" onClick={openCreate}>
            Nouveau contenu
            <Add size={16} />
          </button>
        }
      />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          {save.isError && (
            <InlineNotification kind="error" title="Échec de l'enregistrement" lowContrast />
          )}

          {/* Direct en cours */}
          <Panel title="Direct" sub="Session de culte en temps réel">
            {live.isLoading ? (
              <Loading withOverlay={false} />
            ) : live.data ? (
              <div className="cds-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                <div>
                  <div className="cds-tile__label">
                    <span>{live.data.title}</span>
                    {live.data.state === 'live' && <Tag tone="red">EN DIRECT</Tag>}
                  </div>
                  <div className="cds-tile__caption" style={{ marginTop: 2 }}>
                    {[live.data.speaker, live.data.series].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                <div>
                  <div className="cds-tile__caption">Spectateurs</div>
                  <strong>{live.data.viewersLive.toLocaleString()}</strong>
                </div>
                <div>
                  <div className="cds-tile__caption">Pic</div>
                  <strong>{live.data.viewersPeak.toLocaleString()}</strong>
                </div>
                <div>
                  <div className="cds-tile__caption">Amens</div>
                  <strong>{live.data.amenCount.toLocaleString()}</strong>
                </div>
              </div>
            ) : (
              <Empty>Aucune session live. Activez « En direct » sur un contenu ci-dessous.</Empty>
            )}
          </Panel>

          <Panel
            title="Bibliothèque"
            sub="Collez un lien MP4 / flux HLS (.m3u8) ou un chemin auto-hébergé, choisissez la catégorie et activez le direct."
          >
            {list.isLoading ? (
              <Loading withOverlay={false} />
            ) : list.error ? (
              <InlineNotification kind="error" title="Erreur de chargement" lowContrast />
            ) : list.data && list.data.length > 0 ? (
              <table className="cds-data-table cds-data-table--compact">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Catégorie</th>
                    <th>Statut</th>
                    <th>En direct</th>
                    <th className="num">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((c) => (
                    <tr key={c.id}>
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
                      <td>
                        <Toggle
                          id={`live-${c.id}`}
                          size="sm"
                          hideLabel
                          labelText="En direct"
                          labelA="Non"
                          labelB="Live"
                          toggled={c.isLive}
                          onToggle={(checked: boolean) => toggleLive.mutate({ id: c.id, isLive: checked })}
                        />
                      </td>
                      <td className="num">
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
                            onClick={() => remove.mutate(c.id)}
                          >
                            <TrashCan size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Empty>Aucun contenu. Ajoutez-en un.</Empty>
            )}
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
        onRequestSubmit={() => save.mutate(form)}
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
              {CATEGORIES.map((c) => <SelectItem key={c} value={c} text={c} />)}
            </Select>
            <Select id="status" labelText="Statut" value={form.status} onChange={(e) => set({ status: e.target.value })}>
              {STATUSES.map((s) => <SelectItem key={s} value={s} text={s} />)}
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
    </>
  );
}
