import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextInput, InlineNotification, Tile } from '@carbon/react';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('+243810000001');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onRequest = async () => {
    setError('');
    setBusy(true);
    try {
      await requestOtp(phone);
      setStep('otp');
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message);
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
      setError(e.response?.data?.message ?? e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tile className="ipck-login">
      <h2>IPCK House — Admin</h2>
      <p>Connexion staff (pasteur / admin)</p>
      {error && <InlineNotification kind="error" title="Erreur" subtitle={error} lowContrast />}
      {step === 'phone' ? (
        <>
          <TextInput
            id="phone"
            labelText="Téléphone (E.164)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button onClick={onRequest} disabled={busy}>
            Recevoir le code
          </Button>
        </>
      ) : (
        <>
          <TextInput
            id="code"
            labelText="Code OTP (visible dans les logs backend en dev)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button onClick={onVerify} disabled={busy}>
            Se connecter
          </Button>
          <Button kind="ghost" onClick={() => setStep('phone')}>
            Changer de numéro
          </Button>
        </>
      )}
    </Tile>
  );
}
