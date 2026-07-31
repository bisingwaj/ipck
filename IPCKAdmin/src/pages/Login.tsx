import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextInput, InlineNotification } from '@carbon/react';
import { useAuth } from '../auth/AuthContext';
import { useLang } from '../i18n';

export default function Login() {
  const { requestOtp, verifyOtp } = useAuth();
  const { t, lang, toggle } = useLang();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('+243810000001');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const errMsg = (e: any): string => {
    if (e?.response?.data?.message) return e.response.data.message;
    if (e?.code === 'ERR_NETWORK' || e?.message === 'Network Error')
      return t('login.serverUnreachable');
    return e?.message ?? t('login.genericError');
  };

  const onRequest = async () => {
    setError('');
    setBusy(true);
    try {
      await requestOtp(phone);
      setStep('otp');
    } catch (e: any) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    setError('');
    setBusy(true);
    try {
      await verifyOtp(phone, code);
      navigate('/');
    } catch (e: any) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cds-login-wrap">
      <div className="cds-login">
        <div className="cds-login__topbar">
          <div className="cds-login__brand">
            IPCK House<em>[Admin]</em>
          </div>
          <button
            type="button"
            className="cds-langtoggle cds-langtoggle--login"
            onClick={toggle}
            title={t('header.lang')}
            aria-label={`${t('header.lang')} → ${lang === 'fr' ? 'EN' : 'FR'}`}
          >
            <span className={'cds-langtoggle__opt' + (lang === 'fr' ? ' is-on' : '')}>FR</span>
            <span className="cds-langtoggle__sep">/</span>
            <span className={'cds-langtoggle__opt' + (lang === 'en' ? ' is-on' : '')}>EN</span>
          </button>
        </div>
        <h1 className="cds-login__title">{t('login.title')}</h1>
        <p className="cds-login__subtitle">{t('login.subtitle')}</p>

        {error && <InlineNotification kind="error" title={t('login.error')} subtitle={error} lowContrast />}

        {step === 'phone' ? (
          <>
            <TextInput
              id="phone"
              labelText={t('login.phone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="cds-login__actions">
              <Button onClick={onRequest} disabled={busy}>
                {t('login.requestCode')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <TextInput
              id="code"
              labelText={t('login.otp')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <div className="cds-login__actions">
              <Button onClick={onVerify} disabled={busy}>
                {t('login.signIn')}
              </Button>
              <Button kind="ghost" onClick={() => setStep('phone')}>
                {t('login.changeNumber')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
