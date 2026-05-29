import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/typography';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
}

export function Field({ label, hint, error, style, ...rest }: Props) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={tokens.textTertiary}
        style={[styles.input, error && { borderColor: tokens.error }, style]}
        {...rest}
      />
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={[styles.hint, { color: tokens.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1,
    color: tokens.textSecondary, textTransform: 'uppercase', marginBottom: 6,
  },
  input: {
    backgroundColor: tokens.surface, borderRadius: tokens.radiusMd,
    paddingHorizontal: 14, paddingVertical: 14,
    fontFamily: fonts.ui, fontSize: 16, color: tokens.text,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  hint: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 6 },
});
