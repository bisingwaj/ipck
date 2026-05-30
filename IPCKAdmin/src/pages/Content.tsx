import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loading,
  InlineNotification,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
  Button,
  Tag,
  Toggle,
  Modal,
  TextInput,
  TextArea,
  Select,
  SelectItem,
} from '@carbon/react';
import { Add, Edit, TrashCan } from '@carbon/icons-react';
import { api } from '../api/client';

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
    <div className="ipck-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>Contenus vidéo</h2>
        <Button renderIcon={Add} onClick={openCreate}>Nouveau contenu</Button>
      </div>
      <p style={{ color: '#6f6f6f', margin: '0.5rem 0 1.5rem' }}>
        Collez un lien vidéo direct (MP4 / flux HLS .m3u8) ou un chemin auto-hébergé <code>/media/videos/&lt;fichier&gt;.mp4</code>,
        choisissez la catégorie et activez le direct. L'app s'actualise automatiquement.
      </p>

      {save.isError && <InlineNotification kind="error" title="Échec de l'enregistrement" lowContrast />}

      {list.isLoading ? (
        <Loading withOverlay={false} />
      ) : list.error ? (
        <InlineNotification kind="error" title="Erreur de chargement" lowContrast />
      ) : (
        <StructuredListWrapper>
          <StructuredListHead>
            <StructuredListRow head>
              <StructuredListCell head>Titre</StructuredListCell>
              <StructuredListCell head>Catégorie</StructuredListCell>
              <StructuredListCell head>Statut</StructuredListCell>
              <StructuredListCell head>En direct</StructuredListCell>
              <StructuredListCell head>Actions</StructuredListCell>
            </StructuredListRow>
          </StructuredListHead>
          <StructuredListBody>
            {list.data?.map((c) => (
              <StructuredListRow key={c.id}>
                <StructuredListCell>
                  <strong>{c.title}</strong>
                  {c.featured && <Tag type="purple" size="sm" style={{ marginLeft: 8 }}>À la une</Tag>}
                  <div style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>{[c.speaker, c.series].filter(Boolean).join(' · ')}</div>
                </StructuredListCell>
                <StructuredListCell><Tag type="cool-gray">{c.category}</Tag></StructuredListCell>
                <StructuredListCell>
                  <Tag type={c.status === 'published' ? 'green' : 'gray'}>{c.status}</Tag>
                </StructuredListCell>
                <StructuredListCell>
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
                </StructuredListCell>
                <StructuredListCell>
                  <Button size="sm" kind="ghost" hasIconOnly iconDescription="Éditer" renderIcon={Edit} onClick={() => openEdit(c)} />
                  <Button size="sm" kind="danger--ghost" hasIconOnly iconDescription="Supprimer" renderIcon={TrashCan} onClick={() => remove.mutate(c.id)} />
                </StructuredListCell>
              </StructuredListRow>
            ))}
            {list.data?.length === 0 && (
              <StructuredListRow><StructuredListCell>Aucun contenu. Ajoutez-en un.</StructuredListCell></StructuredListRow>
            )}
          </StructuredListBody>
        </StructuredListWrapper>
      )}

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
    </div>
  );
}
