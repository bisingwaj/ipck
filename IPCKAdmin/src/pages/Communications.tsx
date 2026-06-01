import { useState } from 'react';
import { TextInput, TextArea, Select, SelectItem } from '@carbon/react';
import { SendAlt, Notification } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel } from '../components/ui';
import { useAction } from '../api/useAction';
import { useAuth } from '../auth/AuthContext';

const AUDIENCES = [
  { value: 'all', text: 'Tous les membres', desc: 'Tous les comptes de la communauté.' },
  { value: 'devo-subscribers', text: 'Abonnés dévotion', desc: 'Membres qui lisent la dévotion quotidienne.' },
];

const TITLE_MAX = 120;
const BODY_MAX = 500;

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
        title: form.title.trim(),
        body: form.body.trim(),
      }),
    confirm: () => ({
      title: 'Diffuser cette notification ?',
      message:
        "Le message sera envoyé en push et apparaîtra dans l'onglet Today de tous les membres ciblés. Cette action est irréversible.",
      confirmLabel: 'Diffuser maintenant',
    }),
    successTitle: 'Notification diffusée',
    successSubtitle: (res) => {
      const r = res?.data;
      return r ? `${r.recipients} membre(s) notifié(s) · ${r.pushed} push envoyé(s).` : undefined;
    },
    errorTitle: 'La diffusion a échoué',
    onDone: () => setForm((f) => ({ ...f, title: '', body: '' })),
  });

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const title = form.title.trim();
  const body = form.body.trim();
  const canSend = !!title && !!body;
  const audienceLabel = AUDIENCES.find((a) => a.value === form.audience)?.text ?? form.audience;

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

          {/* Rappel d'impact (principe : sentir la gravité de l'action) */}
          <div className="cds-notification">
            <span className="cds-notification__icon">
              <Notification size={20} />
            </span>
            <div style={{ flex: 1 }}>
              <div className="cds-notification__title">Diffusion en temps réel</div>
              <div className="cds-notification__body">
                Le message part en notification push et s'affiche dans l'onglet Today. L'envoi est
                immédiat et irréversible — relisez l'aperçu avant de diffuser.
              </div>
            </div>
          </div>

          <Panel title="Nouvelle diffusion" sub="Composez à gauche, prévisualisez à droite.">
            <div className="cds-broadcast">
              {/* ── Composer ── */}
              <div className="cds-broadcast__form">
                <div className="cds-form" style={{ gap: 'var(--spacing-05)' }}>
                  <Select
                    id="audience"
                    labelText="Audience"
                    helperText={AUDIENCES.find((a) => a.value === form.audience)?.desc}
                    value={form.audience}
                    disabled={!mayBroadcast}
                    onChange={(e) => set({ audience: e.target.value })}
                  >
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a.value} value={a.value} text={a.text} />
                    ))}
                  </Select>

                  <div>
                    <TextInput
                      id="title"
                      labelText="Titre"
                      placeholder="Ex. Culte de dimanche · 9h"
                      maxLength={TITLE_MAX}
                      disabled={!mayBroadcast}
                      value={form.title}
                      onChange={(e) => set({ title: e.target.value })}
                    />
                    <div className={'cds-countline' + (form.title.length > TITLE_MAX - 20 ? ' cds-countline--warn' : '')}>
                      {form.title.length}/{TITLE_MAX}
                    </div>
                  </div>

                  <div>
                    <TextArea
                      id="body"
                      labelText="Message"
                      placeholder="Le contenu de la notification, clair et concis."
                      rows={5}
                      maxLength={BODY_MAX}
                      disabled={!mayBroadcast}
                      value={form.body}
                      onChange={(e) => set({ body: e.target.value })}
                    />
                    <div className={'cds-countline' + (form.body.length > BODY_MAX - 50 ? ' cds-countline--warn' : '')}>
                      {form.body.length}/{BODY_MAX}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Aperçu push (téléphone) ── */}
              <div className="cds-broadcast__preview">
                <span className="cds-broadcast__preview-eyebrow">Aperçu sur mobile</span>
                <div className="cds-phone">
                  <div className="cds-phone__status">
                    <span>9:41</span>
                    <span>IPCK</span>
                  </div>
                  <div className="cds-phone__notch" />
                  <div className="cds-push">
                    <span className="cds-push__icon">
                      <Notification size={16} />
                    </span>
                    <div className="cds-push__content">
                      <div className="cds-push__head">
                        <span className="cds-push__app">IPCK Connect</span>
                        <span className="cds-push__time">maintenant</span>
                      </div>
                      <div className={'cds-push__title' + (title ? '' : ' cds-push__title--empty')}>
                        {title || 'Titre de la notification'}
                      </div>
                      <div className={'cds-push__body' + (body ? '' : ' cds-push__body--empty')}>
                        {body || 'Le message s’affichera ici, tel que les membres le verront.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Pied : impact + action ── */}
              <div className="cds-broadcast__footer">
                <div className="cds-broadcast__footer-meta">
                  Cible : <strong>{audienceLabel}</strong>
                  {!canSend && ' · titre et message requis'}
                </div>
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
