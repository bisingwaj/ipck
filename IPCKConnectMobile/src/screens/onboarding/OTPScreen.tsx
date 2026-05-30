import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, ScreenContainer, toast, TopBar } from '../../components';
import { useAuth } from '../../auth/AuthContext';
import { USE_MOCKS } from '../../api/config';
import { apiMessage } from '../../api/errors';

const RESEND_SECONDS = 48;

export default function OTPScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { verifyOtp, requestOtp } = useAuth();
  const phone = route.params?.phone || '+243 •• ••• ••••';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const refs = useRef<(TextInput | null)[]>([]);
  const submitted = useRef(false);

  const filled = digits.every(d => d.length === 1);

  // Compte à rebours du renvoi.
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const onConfirm = async () => {
    const code = digits.join('');
    if (USE_MOCKS) {
      nav.navigate('ProfileSetup');
      return;
    }
    try {
      setBusy(true);
      const { isNewUser } = await verifyOtp(phone, code);
      if (isNewUser) nav.navigate('ProfileSetup');
      else nav.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      // Code refusé → on efface et on refocalise pour réessayer.
      setDigits(['', '', '', '', '', '']);
      submitted.current = false;
      refs.current[0]?.focus();
      toast.error('That code did not match', apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  // Auto-validation dès que les 6 chiffres sont saisis.
  useEffect(() => {
    if (!filled) { submitted.current = false; return; }
    if (!busy && !submitted.current) {
      submitted.current = true;
      onConfirm();
    }
  }, [digits, filled, busy]);

  const update = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '');
    // Collage d'un code → répartition dans les cases.
    if (clean.length > 1) {
      const next = [...digits];
      for (let k = 0; k < clean.length && i + k < 6; k++) next[i + k] = clean[k];
      setDigits(next);
      refs.current[Math.min(i + clean.length, 6) - 1]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean.slice(-1);
    setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const onKeyPress = (i: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    // Backspace sur une case vide → recule et efface la précédente.
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = '';
      setDigits(next);
      refs.current[i - 1]?.focus();
    }
  };

  const onResend = async () => {
    if (seconds > 0) return;
    try {
      if (!USE_MOCKS) await requestOtp(phone);
      setSeconds(RESEND_SECONDS);
      setDigits(['', '', '', '', '', '']);
      submitted.current = false;
      refs.current[0]?.focus();
    } catch (e) {
      toast.error('Take heart', apiMessage(e));
    }
  };

  return (
    <ScreenContainer
      scroll={false}
      padded={false}
      footer={<Button fullWidth disabled={!filled || busy} onPress={onConfirm}>{busy ? 'Verifying…' : 'Confirm'}</Button>}
    >
      <TopBar back />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8 }}>
        <Text style={styles.eyebrow}>2 OF 4 · VERIFY</Text>
        <Text style={styles.h1}>Enter the 6-digit code</Text>
        <Text style={styles.body}>We sent it to {phone}.</Text>

        <View style={styles.row}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={el => (refs.current[i] = el)}
              value={d}
              onChangeText={v => update(i, v)}
              onKeyPress={e => onKeyPress(i, e)}
              keyboardType="number-pad"
              maxLength={6}
              editable={!busy}
              style={[styles.cell, d && styles.cellFilled]}
              autoFocus={i === 0}
            />
          ))}
        </View>

        <Pressable style={{ marginTop: 24 }} onPress={onResend} disabled={seconds > 0}>
          <Text style={[styles.resend, seconds === 0 && styles.resendActive]}>
            {seconds > 0 ? `Resend code in 0:${String(seconds).padStart(2, '0')}` : 'Resend code'}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary, marginTop: 16 },
  h1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 8 },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: tokens.textSecondary, marginTop: 10 },
  row: { flexDirection: 'row', gap: 10, marginTop: 28, justifyContent: 'space-between' },
  cell: { width: 46, height: 56, borderRadius: 10, backgroundColor: tokens.surface, textAlign: 'center', fontFamily: fonts.uiBold, fontSize: 22, color: tokens.text, borderWidth: 1.5, borderColor: 'transparent' },
  cellFilled: { borderColor: tokens.primary, backgroundColor: tokens.primaryTint },
  resend: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.textSecondary, textAlign: 'center' },
  resendActive: { color: tokens.primary },
});
