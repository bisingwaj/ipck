// Système de feedback maison — remplace les Alert.alert natifs.
// Toasts éphémères animés (couleur par variante) + confirmation modale animée.
// Branché une fois à la racine via <FeedbackProvider>. API impérative dans feedbackController.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, Modal, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/typography';
import { Icon, IconName } from './Icon';
import { Button } from './Button';
import { BrandMark } from './BrandMark';
import {
  registerFeedback,
  ToastInput,
  ToastVariant,
  ConfirmInput,
} from './feedbackController';

// Android : active l'animation de layout (repli fluide de la pile à la sortie).
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Repli doux des toasts restants quand l'un d'eux sort.
const TOAST_LAYOUT = {
  duration: 260,
  update: { type: LayoutAnimation.Types.easeInEaseOut },
  delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
};

const VARIANT: Record<ToastVariant, { fg: string; tint: string; icon: IconName }> = {
  success: { fg: tokens.success, tint: tokens.successTint, icon: 'check' },
  error:   { fg: tokens.error,   tint: tokens.errorTint,   icon: 'close' },
  info:    { fg: tokens.primary, tint: tokens.surfaceTint, icon: 'bell' },
};

interface ToastEntry extends ToastInput {
  id: number;
  variant: ToastVariant;
}

const DURATION = 3600;

function ToastCard({ entry, onDone }: { entry: ToastEntry; onDone: (id: number) => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current; // barre d'auto-fermeture
  const v = VARIANT[entry.variant];
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    progress.stopAnimation();
    Animated.timing(anim, { toValue: 0, duration: 320, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })
      .start(({ finished }) => { if (finished) onDone(entry.id); });
  }, [anim, progress, entry.id, onDone]);

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 90 }).start();
    Animated.timing(progress, { toValue: 0, duration: DURATION, easing: Easing.linear, useNativeDriver: false }).start();
    timer.current = setTimeout(dismiss, DURATION);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [anim, progress, dismiss]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-22, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }, { scale }] }}>
      <Pressable onPress={dismiss} style={styles.toast}>
        <View style={[styles.accent, { backgroundColor: v.fg }]} />

        {/* Logo de l'app + badge de variante coloré */}
        <View style={styles.logoWrap}>
          <BrandMark size={30} />
          <View style={[styles.badge, { backgroundColor: v.fg }]}>
            <Icon name={v.icon} size={11} color="#fff" strokeWidth={3} />
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.toastTitle} numberOfLines={1}>{entry.title}</Text>
          {!!entry.message && <Text style={styles.toastMsg} numberOfLines={5}>{entry.message}</Text>}
        </View>

        {/* Barre d'auto-fermeture */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: barWidth, backgroundColor: v.fg }]} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

interface ConfirmState extends ConfirmInput {
  resolve: (v: boolean) => void;
}

function ConfirmModal({ state, onClose }: { state: ConfirmState | null; onClose: (v: boolean) => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  const visible = !!state;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 160,
      easing: visible ? Easing.out(Easing.back(1.3)) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const destructive = state?.destructive;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => onClose(false)} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: anim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => onClose(false)} />
        <Animated.View style={[styles.dialog, { opacity: anim, transform: [{ scale }] }]}>
          <View style={[styles.dialogIcon, { backgroundColor: destructive ? tokens.errorTint : tokens.surfaceTint }]}>
            <Icon name={destructive ? 'trash' : 'help'} size={22} color={destructive ? tokens.error : tokens.primary} strokeWidth={2.2} />
          </View>
          <Text style={styles.dialogTitle}>{state?.title}</Text>
          {!!state?.message && <Text style={styles.dialogMsg}>{state.message}</Text>}
          <View style={styles.dialogActions}>
            <Button variant="secondary" style={{ flex: 1 }} onPress={() => onClose(false)}>
              {state?.cancelLabel ?? 'Annuler'}
            </Button>
            <Button variant={destructive ? 'danger' : 'primary'} style={{ flex: 1 }} onPress={() => onClose(true)}>
              {state?.confirmLabel ?? 'Confirmer'}
            </Button>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const nextId = useRef(1);

  const show = useCallback((t: ToastInput) => {
    const id = nextId.current++;
    setToasts(prev => [...prev.slice(-2), { id, variant: t.variant ?? 'info', title: t.title, message: t.message }]);
  }, []);

  const remove = useCallback((id: number) => {
    LayoutAnimation.configureNext(TOAST_LAYOUT);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const confirmFn = useCallback((o: ConfirmInput) => {
    return new Promise<boolean>(resolve => setConfirmState({ ...o, resolve }));
  }, []);

  const closeConfirm = useCallback((v: boolean) => {
    setConfirmState(prev => { prev?.resolve(v); return null; });
  }, []);

  useEffect(() => { registerFeedback(show, confirmFn); }, [show, confirmFn]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 8 }]}>
        {toasts.map(t => <ToastCard key={t.id} entry={t} onDone={remove} />)}
      </View>
      <ConfirmModal state={confirmState} onClose={closeConfirm} />
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 14, right: 14, gap: 8, zIndex: 1000 },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: tokens.bg, borderRadius: tokens.radiusLg,
    paddingVertical: 13, paddingLeft: 16, paddingRight: 16,
    borderWidth: 1, borderColor: tokens.borderSoft, overflow: 'hidden',
    shadowColor: '#14181F', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: tokens.radiusLg, borderBottomLeftRadius: tokens.radiusLg },
  logoWrap: {
    width: 42, height: 42, borderRadius: 13, backgroundColor: tokens.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', bottom: -3, right: -3,
    width: 19, height: 19, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: tokens.bg,
  },
  toastTitle: { fontFamily: fonts.uiBold, fontSize: 14.5, color: tokens.editorialInk, letterSpacing: -0.2 },
  toastMsg: { fontFamily: fonts.ui, fontSize: 12.5, lineHeight: 18, color: tokens.textSecondary, marginTop: 2 },
  progressTrack: { position: 'absolute', left: 4, right: 0, bottom: 0, height: 3, backgroundColor: 'transparent' },
  progressBar: { height: 3, opacity: 0.55, borderBottomLeftRadius: 4 },

  backdrop: { flex: 1, backgroundColor: 'rgba(20,24,31,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: tokens.bg, borderRadius: tokens.radiusXl, padding: 24, alignItems: 'center' },
  dialogIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  dialogTitle: { fontFamily: fonts.serifBold, fontSize: 21, color: tokens.editorialInk, textAlign: 'center', letterSpacing: -0.3 },
  dialogMsg: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 21, color: tokens.textSecondary, textAlign: 'center', marginTop: 8 },
  dialogActions: { flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' },
});
