import { useState } from 'react';
import { TextInput, TextArea, Select, SelectItem } from '@carbon/react';
import { SendAlt } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel } from '../components/ui';
import { useAction } from '../api/useAction';
import { useAuth } from '../auth/AuthContext';

const AUDIENCES = [
  { value: 'all', text: 'Tous les membres' },
  { value: 'devo-subscribers', text: 'Abonnés dévotion' },
];

interface BroadcastResult {
  recipients: number;
  pushed: number;
}

export default function Communications() {
  const { can } = useAuth();
  const mayBroadcast = can('broadcast.send');
  const [form, setForm] = useState({ audience: 'all', title: '', body: '' });

  // Principe 3 : diffusion = action à fort impact → confirmation explicite,
  // blocage pendant l'envoi, et retour chiffré (combien de membres touchés).
  const broadcast = useAction<void, { data: BroadcastResult }>({
    mutationFn: () =>
      api.post('/notifications/broadcast', {
        audience: form.audience,
        title: form.title,
        body: form.body,
      }),
    confirm: () => ({
      title: 'Diffuser cette notification ?',
      message:
        'Le message sera envoyé en push et apparaîtra dans l\'onglet Today de tous les membres ciblés. Cette action est irréversible.',
      confirmLabel: 'Diffuser maintenant',
    }),
    successTitle: 'Notification diffusée',
    successSubtitle: (res) => {
      const r = res?.data;
      return r ? `${r.recipients} membre(s) notifié(s) · ${r.pushed} push envoyé(s).` : undefined;
    },
    errorTitle: "La diffusion a échoué",
    onDone: () => setForm((f) => ({ ...f, title: '', body: '' })),
  });

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const canSend = !!form.title.trim() && !!form.body.trim();

  return (
    <>
      <PageHead
        title="Communications"
        subtitle="Diffuser une notification push aux membres de l'Église"
      />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          {!mayBroadcast && (
            <div className="cds-notification cds-notification--warn">
              <div className="cds-notification__body">
                Vous n'avez pas les droits pour diffuser une notification. Réservé au staff
                (pasteur/administrateur).
              </div>
            </div>
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
                disabled={!mayBroadcast}
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
                disabled={!mayBroadcast}
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
              />
              <TextArea
                id="body"
                labelText="Message"
                rows={4}
                maxLength={500}
                disabled={!mayBroadcast}
                value={form.body}
                onChange={(e) => set({ body: e.target.value })}
              />
              <div>
                <button
                  className="cds-btn cds-btn--md"
                  onClick={() => broadcast.run()}
                  disabled={!mayBroadcast || !canSend || broadcast.isPending}
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
