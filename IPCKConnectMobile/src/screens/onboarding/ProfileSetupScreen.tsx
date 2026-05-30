import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Field, Icon, ScreenContainer, toast, TopBar } from '../../components';
import { useUpdateProfile } from '../../api/mutations';
import { useAuth } from '../../auth/AuthContext';
import { apiMessage } from '../../api/errors';

const AGE_GROUPS = ['16–25', '26–40', '41–60', '60+'];
const STEPS = ['first', 'last', 'age'] as const;
type Step = (typeof STEPS)[number];

export default function ProfileSetupScreen() {
  const nav = useNavigation<any>();
  const [step, setStep] = useState<Step>('first');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [age, setAge] = useState<string | null>(null);
  const updateProfile = useUpdateProfile();
  const { refreshMe } = useAuth();

  const idx = STEPS.indexOf(step);

  // Retour : étape précédente, ou on quitte l'écran depuis la 1re étape.
  const onBack = () => {
    if (idx === 0) nav.goBack();
    else setStep(STEPS[idx - 1]);
  };

  const canContinue =
    step === 'first' ? !!first.trim() :
    step === 'last'  ? !!last.trim()  :
    !!age;

  // Avance d'une étape ; à la dernière, persiste le profil puis passe aux intérêts.
  // NB: l'âge reste local (le DTO backend strict n'accepte que firstName/lastName).
  const onNext = async () => {
    if (step === 'first') return setStep('last');
    if (step === 'last') return setStep('age');
    try {
      await updateProfile.mutateAsync({ firstName: first.trim(), lastName: last.trim() });
      await refreshMe();
      nav.navigate('Interests');
    } catch (e) {
      toast.error('Take heart', apiMessage(e));
    }
  };

  return (
    <ScreenContainer
      footer={
        <Button fullWidth disabled={!canContinue || updateProfile.isPending} onPress={onNext}>
          {step === 'age' ? 'Continue' : 'Next'}
        </Button>
      }
    >
      <TopBar back onBack={onBack} />

      {/* Sous-progression (3 étapes) */}
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.bar, i <= idx && styles.barOn]} />
        ))}
      </View>

      <Text style={styles.eyebrow}>3 OF 4 · YOUR NAME · STEP {idx + 1} OF 3</Text>

      {step === 'first' && (
        <>
          <Text style={styles.h1}>What should we call you?</Text>
          <Text style={styles.body}>So your pastor and small group know who you are.</Text>
          <View style={{ marginTop: 28 }}>
            <Field label="First name" value={first} onChangeText={setFirst} placeholder="Grace" autoFocus />
          </View>
        </>
      )}

      {step === 'last' && (
        <>
          <Text style={styles.h1}>And your family name?</Text>
          <Text style={styles.body}>Hi {first.trim()} — what's your last name?</Text>
          <View style={{ marginTop: 28 }}>
            <Field label="Last name" value={last} onChangeText={setLast} placeholder="Mbuyi" autoFocus />
          </View>
        </>
      )}

      {step === 'age' && (
        <>
          <Text style={styles.h1}>Your age group</Text>
          <Text style={styles.body}>This helps your pastor care for you well.</Text>
          <View style={{ marginTop: 28 }}>
            <Text style={styles.fieldLabel}>AGE GROUP</Text>
            <View style={styles.ageRow}>
              {AGE_GROUPS.map(g => {
                const on = age === g;
                return (
                  <Pressable key={g} onPress={() => setAge(g)} style={[styles.age, on && styles.ageOn]}>
                    <Text style={[styles.ageTxt, on && styles.ageTxtOn]}>{g}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.privacyNote}>
              <Icon name="lock" size={14} color={tokens.textSecondary} />
              <Text style={styles.privacyText}>Only your name is visible to your group. Age is private to the pastoral team.</Text>
            </View>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: 4, marginTop: 12 },
  bar: { flex: 1, height: 3, borderRadius: 99, backgroundColor: tokens.surface },
  barOn: { backgroundColor: tokens.primary },
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary, marginTop: 16 },
  h1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 8 },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: tokens.textSecondary, marginTop: 10 },
  fieldLabel: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1, color: tokens.textSecondary, marginBottom: 8 },
  ageRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  age: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 99, borderWidth: 1.5, borderColor: tokens.border },
  ageOn: { borderColor: tokens.primary, backgroundColor: tokens.primaryTint },
  ageTxt: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },
  ageTxtOn: { color: tokens.primary },
  privacyNote: { flexDirection: 'row', gap: 8, marginTop: 24, padding: 14, borderRadius: 10, backgroundColor: tokens.surface, alignItems: 'flex-start' },
  privacyText: { flex: 1, fontFamily: fonts.ui, fontSize: 12, lineHeight: 18, color: tokens.textSecondary },
});
