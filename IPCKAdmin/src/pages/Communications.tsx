import { useState } from 'react';
import { TextInput, TextArea, Select, SelectItem } from '@carbon/react';
import { SendAlt, Notification } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel } from '../components/ui';
import { useAction } from '../api/useAction';
import { useAuth } from '../auth/AuthContext';
import { t } from '../i18n';

const AUDIENCES = [
  { value: 'all', textKey: 'comms.audienceAll', descKey: 'comms.audienceAllDesc' },
  { value: 'devo-subscribers', textKey: 'comms.audienceDevo', descKey: 'comms.audienceDevoDesc' },
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
      title: t('comms.confirmTitle'),
      message: t('comms.confirmMsg'),
      confirmLabel: t('comms.confirmLabel'),
    }),
    successTitle: t('comms.sentTitle'),
    successSubtitle: (res) => {
      const r = res?.data;
      return r ? `${r.recipients} ${t('comms.notified')} ${r.pushed} ${t('comms.pushSent')}` : undefined;
    },
    errorTitle: t('comms.sendFailed'),
    onDone: () => setForm((f) => ({ ...f, title: '', body: '' })),
  });

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const title = form.title.trim();
  const body = form.body.trim();
  const canSend = !!title && !!body;
  const audienceMeta = AUDIENCES.find((a) => a.value === form.audience);
  const audienceLabel = audienceMeta ? t(audienceMeta.textKey) : form.audience;

  return (
    <>
      <PageHead title={t('comms.title')} subtitle={t('comms.subtitle')} />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          {!mayBroadcast && (
            <div className="cds-notification cds-notification--warn">
              <div className="cds-notification__body">{t('comms.noRights')}</div>
            </div>
          )}

          {/* Rappel d'impact (principe : sentir la gravité de l'action) */}
          <div className="cds-notification">
            <span className="cds-notification__icon">
              <Notification size={20} />
            </span>
            <div style={{ flex: 1 }}>
              <div className="cds-notification__title">{t('comms.realtimeTitle')}</div>
              <div className="cds-notification__body">{t('comms.realtimeBody')}</div>
            </div>
          </div>

          <Panel title={t('comms.newBroadcast')} sub={t('comms.newBroadcastSub')}>
            <div className="cds-broadcast">
              {/* ── Composer ── */}
              <div className="cds-broadcast__form">
                <div className="cds-form" style={{ gap: 'var(--spacing-05)' }}>
                  <Select
                    id="audience"
                    labelText={t('comms.audience')}
                    helperText={audienceMeta ? t(audienceMeta.descKey) : undefined}
                    value={form.audience}
                    disabled={!mayBroadcast}
                    onChange={(e) => set({ audience: e.target.value })}
                  >
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a.value} value={a.value} text={t(a.textKey)} />
                    ))}
                  </Select>

                  <div>
                    <TextInput
                      id="title"
                      labelText={t('comms.titleLabel')}
                      placeholder={t('comms.titlePlaceholder')}
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
                      labelText={t('comms.message')}
                      placeholder={t('comms.messagePlaceholder')}
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
                <span className="cds-broadcast__preview-eyebrow">{t('comms.previewMobile')}</span>
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
                        <span className="cds-push__time">{t('comms.pushNow')}</span>
                      </div>
                      <div className={'cds-push__title' + (title ? '' : ' cds-push__title--empty')}>
                        {title || t('comms.pushTitlePlaceholder')}
                      </div>
                      <div className={'cds-push__body' + (body ? '' : ' cds-push__body--empty')}>
                        {body || t('comms.pushBodyPlaceholder')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Pied : impact + action ── */}
              <div className="cds-broadcast__footer">
                <div className="cds-broadcast__footer-meta">
                  {t('comms.target')} <strong>{audienceLabel}</strong>
                  {!canSend && t('comms.titleBodyRequired')}
                </div>
                <button
                  className="cds-btn cds-btn--md"
                  onClick={() => broadcast.run()}
                  disabled={!mayBroadcast || !canSend || broadcast.isPending}
                >
                  {broadcast.isPending ? t('comms.sending') : t('comms.broadcast')}
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
