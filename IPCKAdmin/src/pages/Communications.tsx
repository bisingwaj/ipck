import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  InlineNotification,
  TextInput,
  TextArea,
  Select,
  SelectItem,
} from '@carbon/react';
import { SendAlt } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel } from '../components/ui';

const AUDIENCES = [
  { value: 'all', text: 'Tous les membres' },
  { value: 'devo-subscribers', text: 'Abonnés dévotion' },
];

export default function Communications() {
  const [form, setForm] = useState({ audience: 'all', title: '', body: '' });

  const broadcast = useMutation({
    mutationFn: () =>
      api.post('/notifications/broadcast', {
        audience: form.audience,
        title: form.title,
        body: form.body,
      }),
    onSuccess: () => setForm((f) => ({ ...f, title: '', body: '' })),
  });

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const canSend = form.title.trim() && form.body.trim();
  const sent = (broadcast.data?.data as { sent: number } | undefined)?.sent;

  return (
    <>
      <PageHead
        title="Communications"
        subtitle="Diffuser une notification push aux membres de l'Église"
      />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          {broadcast.isSuccess && (
            <InlineNotification
              kind="success"
              title="Notification envoyée"
              subtitle={sent != null ? `Diffusée à ${sent} membre(s).` : undefined}
              lowContrast
            />
          )}
          {broadcast.isError && (
            <InlineNotification kind="error" title="Échec de l'envoi" lowContrast />
          )}

          <Panel
            title="Nouvelle diffusion"
            sub="Le message apparaît dans l'onglet Today de l'app mobile et en push."
          >
            <div style={{ display: 'grid', gap: '1rem', maxWidth: 640 }}>
              <Select
                id="audience"
                labelText="Audience"
                value={form.audience}
                onChange={(e) => set({ audience: e.target.value })}
              >
                {AUDIENCES.map((a) => (
                  <SelectItem key={a.value} value={a.value} text={a.text} />
                ))}
              </Select>
              <TextInput
                id="title"
                labelText="Titre"
                maxLength={120}
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
              />
              <TextArea
                id="body"
                labelText="Message"
                rows={4}
                maxLength={500}
                value={form.body}
                onChange={(e) => set({ body: e.target.value })}
              />
              <div>
                <button
                  className="cds-btn cds-btn--md"
                  onClick={() => broadcast.mutate()}
                  disabled={!canSend || broadcast.isPending}
                >
                  {broadcast.isPending ? 'Envoi…' : 'Diffuser'}
                  <SendAlt size={16} />
                </button>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
