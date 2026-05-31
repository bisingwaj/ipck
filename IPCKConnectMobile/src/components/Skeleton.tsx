import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

/**
 * Placeholder de chargement (barre pulsante). Affiché à la place d'une valeur
 * tant que la donnée n'est pas chargée → l'écran lit « en cours » au lieu
 * d'afficher une valeur fausse/zéro puis de « rafraîchir ».
 */
export function Skeleton({
  width = 80,
  height = 22,
  radius = 8,
  style,
  light = false,
}: {
  width?: number;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  light?: boolean;
}) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: light ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}
