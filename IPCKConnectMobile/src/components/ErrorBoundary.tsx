import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/typography';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Filet de sécurité : si un écran lève une exception au rendu (forme de données
 * inattendue, accès non gardé…), on affiche un état lisible avec « Réessayer »
 * AU LIEU de laisser l'app planter/recharger entièrement. Évite les « écrans
 * corrompus » et le reload brutal signalés à l'entrée des écrans.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Log silencieux (visible en dev). Pas d'action destructive.
    // eslint-disable-next-line no-console
    console.warn('[ErrorBoundary] écran en erreur:', error);
  }

  private reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Un instant…</Text>
        <Text style={styles.body}>
          Cet écran n'a pas pu s'afficher correctement. Réessayez — vos données sont en sécurité.
        </Text>
        <Pressable style={styles.btn} onPress={this.reset} hitSlop={8}>
          <Text style={styles.btnTxt}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bg, padding: 28, gap: 12 },
  title: { fontFamily: fonts.serifBold, fontSize: 24, color: tokens.editorialInk },
  body: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 22, color: tokens.textSecondary, textAlign: 'center', maxWidth: 300 },
  btn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99, backgroundColor: tokens.primary },
  btnTxt: { fontFamily: fonts.uiBold, fontSize: 15, color: '#fff' },
});
