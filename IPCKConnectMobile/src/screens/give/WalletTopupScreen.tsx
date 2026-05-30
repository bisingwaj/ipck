import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Field, Icon, ScreenContainer, toast, TopBar } from '../../components';
import { usePaymentMethods } from '../../api/hooks';
import { useTopupWallet } from '../../api/mutations';
import { apiMessage } from '../../api/errors';

const PRESETS = [10, 25, 50, 100, 200, 500];

type Step = 'amount' | 'method' | 'confirm';
const STEPS: { id: Step; label: string }[] = [
  { id: 'amount',  label: 'How many' },
  { id: 'method',  label: 'Give' },
  { id: 'confirm', label: 'Confirm' },
];

export default function WalletTopupScreen() {
  const nav = useNavigation<any>();
  const paymentMethods = usePaymentMethods();
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState(0); // construit en additionnant les presets (+10, +50, …)
  const [method, setMethod] = useState('mpesa');
  const [phone, setPhone] = useState('•• ••• ••28');
  const [processing, setProcessing] = useState(false); // Mobile Money : attente du prompt
  const m = paymentMethods.find(x => x.id === method)!;
  const isMomo = m.kind === 'momo';
  const topup = useTopupWallet();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const idx = STEPS.findIndex(s => s.id === step);

  const onBack = () => {
    if (processing) { if (timer.current) clearTimeout(timer.current); setProcessing(false); return; }
    if (step === 'confirm') return setStep('method');
    if (step === 'method') return setStep('amount');
    nav.goBack();
  };

  // Crédite la Grace Reserve (mock backend → completed synchrone).
  const finishTopup = async () => {
    try {
      await topup.mutateAsync({ coins: amount, method });
      toast.success('Grace Reserve replenished 🙌', `${amount} Blessings added to your reserve. "Each of you should give what you have decided in your heart to give." (2 Corinthians 9:7)`);
      nav.goBack();
    } catch (e) {
      setProcessing(false);
      toast.error('Top-up did not go through', apiMessage(e));
    }
  };

  // Mobile Money : on simule l'envoi du prompt avant de créditer.
  const onSendPrompt = () => {
    setProcessing(true);
    timer.current = setTimeout(finishTopup, 2200);
  };

  // ── Footer selon l'étape / le mode ──
  let footer: React.ReactNode = null;
  if (step === 'amount') {
    footer = <Button fullWidth rightIcon="chevron" disabled={amount < 1} onPress={() => setStep('method')}>Continue</Button>;
  } else if (step === 'method') {
    footer = <Button fullWidth rightIcon="chevron" onPress={() => setStep('confirm')}>Continue</Button>;
  } else if (step === 'confirm' && !processing) {
    footer = isMomo
      ? <Button fullWidth leftIcon="phone" disabled={topup.isPending} onPress={onSendPrompt}>Send prompt to my phone</Button>
      : <Button fullWidth leftIcon="give" disabled={topup.isPending} onPress={finishTopup}>Give ${amount}</Button>;
  }

  return (
    <ScreenContainer scroll={false} footer={footer}>
      <TopBar back onBack={onBack} title="Top up Grace Reserve" />

      {/* Indicateur d'étapes — How many → Give → Confirm */}
      <View style={styles.steps}>
        {STEPS.map((s, i) => {
          const active = i === idx;
          const done = i < idx;
          return (
            <React.Fragment key={s.id}>
              <Pressable onPress={() => i < idx && !processing && setStep(s.id)} style={styles.stepItem} disabled={i >= idx || processing}>
                <View style={[styles.stepDot, (active || done) && styles.stepDotOn]}>
                  {done ? <Icon name="check" size={13} color="#fff" strokeWidth={3} />
                        : <Text style={[styles.stepNum, active && { color: '#fff' }]}>{i + 1}</Text>}
                </View>
                <Text style={[styles.stepLabel, (active || done) && { color: tokens.editorialInk, fontFamily: fonts.uiBold }]}>{s.label}</Text>
              </Pressable>
              {i < STEPS.length - 1 && <View style={[styles.stepBar, done && { backgroundColor: tokens.primary }]} />}
            </React.Fragment>
          );
        })}
      </View>

      {/* ÉTAPE 1 — Montant */}
      {step === 'amount' && (
        <View style={styles.body}>
          <Text style={styles.eyebrow}>STEP 1 OF 3 · AMOUNT</Text>
          <Text style={styles.h1}>How many Blessings?</Text>
          <Text style={styles.lead}>1 Blessing = 1 USD. Tap to add — they never expire.</Text>

          <View style={styles.amtWrap}>
            <View style={styles.amtHands}><Icon name="pray" size={20} color={tokens.accent} /></View>
            <Text style={styles.amt}>{amount}</Text>
            <Text style={styles.amtUnit}>Blessings</Text>
          </View>
          <Text style={styles.usdEq}>≈ ${amount} USD · ~{(amount * 2700).toLocaleString()} CDF</Text>

          <View style={styles.presets}>
            {PRESETS.map(p => (
              <Pressable key={p} onPress={() => setAmount(a => Math.min(5000, a + p))} style={styles.preset}>
                <Text style={styles.presetTxt}>+{p}</Text>
              </Pressable>
            ))}
          </View>

          {amount > 0 && (
            <Pressable onPress={() => setAmount(0)} style={styles.reset} hitSlop={8}>
              <Icon name="close" size={14} color={tokens.textSecondary} />
              <Text style={styles.resetTxt}>Reset</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ÉTAPE 2 — Mode de paiement (Give) */}
      {step === 'method' && (
        <View style={styles.body}>
          <Text style={styles.eyebrow}>STEP 2 OF 3 · GIVE</Text>
          <Text style={styles.h1}>How will you give?</Text>
          <Text style={styles.lead}>Give {amount} Blessings to your Grace Reserve.</Text>

          <View style={{ gap: 8, marginTop: 20 }}>
            {paymentMethods.map(p => {
              const on = method === p.id;
              return (
                <Pressable key={p.id} onPress={() => setMethod(p.id)} style={[styles.method, on && styles.methodOn]}>
                  <View style={[styles.methodLogo, { backgroundColor: p.color }]}>
                    <Text style={styles.methodLogoTxt}>{p.logo}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodName} numberOfLines={1} ellipsizeMode="tail">{p.name}</Text>
                    <Text style={styles.methodSub} numberOfLines={1} ellipsizeMode="tail">{p.kind === 'card' ? 'Visa, Mastercard · instant' : p.instant ? 'Instant prompt' : 'May take a few hours'}</Text>
                  </View>
                  {on && <Icon name="check" size={20} color={tokens.primary} strokeWidth={2.5} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* ÉTAPE 3 — Confirmation, branchée selon le mode */}
      {step === 'confirm' && !processing && (
        <View style={styles.body}>
          <Text style={styles.eyebrow}>STEP 3 OF 3 · CONFIRM</Text>
          <Text style={styles.h1}>One last check</Text>

          <View style={styles.summary}>
            <Row label="Top-up" value={`${amount} Blessings`} />
            <Row label="Method" value={m.name} />
            <Row label="You'll be charged" value={`$${amount}`} bold />
          </View>

          {isMomo ? (
            <Field label={`${m.name} number`} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          ) : (
            <View>
              <Field label="Card number" placeholder="1234 5678 9012 3456" keyboardType="number-pad" />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><Field label="Expiry" placeholder="MM/YY" keyboardType="number-pad" /></View>
                <View style={{ flex: 1 }}><Field label="CVC" placeholder="123" keyboardType="number-pad" secureTextEntry /></View>
              </View>
            </View>
          )}

          <View style={styles.secure}>
            <Icon name="lock" size={13} color={tokens.textSecondary} />
            <Text style={styles.secureTxt}>Secured by your provider. We never store your PIN or card details.</Text>
          </View>
        </View>
      )}

      {/* Mobile Money — attente du prompt */}
      {processing && (
        <View style={styles.processing}>
          <View style={styles.bigCircle}><Icon name="phone" size={44} color={tokens.success} /></View>
          <Text style={styles.h1c}>Check your phone</Text>
          <Text style={styles.processBody}>
            We sent a prompt to <Text style={styles.bold}>+243 {phone}</Text>. Enter your {m.name} PIN to confirm.
          </Text>
          <ActivityIndicator color={tokens.primary} />
          <Text style={styles.waiting}>Waiting for confirmation…</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLbl}>{label}</Text>
      <Text style={[styles.rowVal, bold && { fontFamily: fonts.uiBold, color: tokens.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: tokens.border, alignItems: 'center', justifyContent: 'center' },
  stepDotOn: { backgroundColor: tokens.primary, borderColor: tokens.primary },
  stepNum: { fontFamily: fonts.uiBold, fontSize: 12, color: tokens.textSecondary },
  stepLabel: { fontFamily: fonts.uiMedium, fontSize: 13, color: tokens.textSecondary },
  stepBar: { flex: 1, height: 1.5, backgroundColor: tokens.border, marginHorizontal: 8 },

  body: { flex: 1 },
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.accent, marginTop: 18 },
  h1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 8 },
  lead: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 22, color: tokens.textSecondary, marginTop: 10 },

  amtWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 28 },
  amtHands: { width: 56, height: 56, borderRadius: 28, backgroundColor: tokens.accentTint, alignItems: 'center', justifyContent: 'center' },
  amt: { fontFamily: fonts.serifBold, fontSize: 72, color: tokens.editorialInk, letterSpacing: -2 },
  amtUnit: { fontFamily: fonts.serifMed, fontSize: 16, color: tokens.textSecondary, alignSelf: 'flex-end', paddingBottom: 16 },
  usdEq: { fontFamily: fonts.uiMedium, fontSize: 12, color: tokens.textSecondary, textAlign: 'center', marginTop: 2 },

  presets: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 22 },
  preset: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 99, borderWidth: 1.5, borderColor: tokens.border, minWidth: 70, alignItems: 'center' },
  presetTxt: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },
  reset: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 5, marginTop: 14, paddingVertical: 4 },
  resetTxt: { fontFamily: fonts.uiMedium, fontSize: 13, color: tokens.textSecondary },

  method: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: tokens.border },
  methodOn: { borderColor: tokens.primary, backgroundColor: tokens.primaryTint },
  methodLogo: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  methodLogoTxt: { fontFamily: fonts.uiBold, fontSize: 14, color: '#fff' },
  methodName: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },
  methodSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },

  summary: { padding: 14, borderRadius: 12, backgroundColor: tokens.surface, marginTop: 18, marginBottom: 16, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLbl: { fontFamily: fonts.ui, fontSize: 13, color: tokens.textSecondary },
  rowVal: { fontFamily: fonts.uiMedium, fontSize: 13, color: tokens.text },

  secure: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 16, paddingHorizontal: 2 },
  secureTxt: { flex: 1, fontFamily: fonts.ui, fontSize: 12, lineHeight: 18, color: tokens.textSecondary },

  processing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 16 },
  bigCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: tokens.successTint, alignItems: 'center', justifyContent: 'center' },
  h1c: { fontFamily: fonts.serifBold, fontSize: 26, color: tokens.editorialInk, letterSpacing: -0.4, textAlign: 'center' },
  processBody: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: tokens.textSecondary, textAlign: 'center', maxWidth: 290 },
  bold: { fontFamily: fonts.uiBold, color: tokens.text },
  waiting: { fontFamily: fonts.uiMedium, fontSize: 13, color: tokens.textSecondary },
});
