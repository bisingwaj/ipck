import React from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../theme/tokens';

export function ScreenContainer({
  children, scroll = true, padded = true, footer,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const Container: any = scroll ? ScrollView : View;
  return (
    <View style={styles.flex}>
      <Container
        style={styles.flex}
        contentContainerStyle={scroll ? [
          padded && { paddingHorizontal: 20 },
          { paddingBottom: footer ? 120 : insets.bottom + 24 },
          contentStyle,
        ] : undefined}
        showsVerticalScrollIndicator={false}
      >
        {!scroll && padded ? <View style={{ paddingHorizontal: 20, flex: 1 }}>{children}</View> : children}
      </Container>
      {footer && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>{footer}</View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: tokens.bg },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: tokens.bg, borderTopWidth: 1, borderTopColor: tokens.borderSoft },
});
