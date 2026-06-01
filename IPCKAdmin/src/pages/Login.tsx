import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextInput, InlineNotification } from '@carbon/react';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('+243810000001');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const errMsg = (e: any): string => {
    if (e?.response?.data?.message) return e.response.data.message;
    if (e?.code === 'ERR_NETWORK' || e?.message === 'Network Error')
      return "Serveur injoignable. Vérifiez votre connexion réseau et réessayez.";
    return e?.message ?? 'Une erreur est survenue.';
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
        <div className="cds-login__brand">
          IPCK House<em>[Admin]</em>
        </div>
        <h1 className="cds-login__title">Connexion staff</h1>
        <p className="cds-login__subtitle">Accès réservé aux pasteurs et administrateurs.</p>

        {error && <InlineNotification kind="error" title="Erreur" subtitle={error} lowContrast />}

        {step === 'phone' ? (
          <>
            <TextInput
              id="phone"
              labelText="Téléphone (E.164)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="cds-login__actions">
              <Button onClick={onRequest} disabled={busy}>
                Recevoir le code
              </Button>
            </div>
          </>
        ) : (
          <>
            <TextInput
              id="code"
              labelText="Code OTP (visible dans les logs backend en dev)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <div className="cds-login__actions">
              <Button onClick={onVerify} disabled={busy}>
                Se connecter
              </Button>
              <Button kind="ghost" onClick={() => setStep('phone')}>
                Changer de numéro
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
