import React from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/typography';
import { Icon, IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  leftIcon?: IconName;
  rightIcon?: IconName;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  children, onPress, variant = 'primary', size = 'md',
  leftIcon, rightIcon, fullWidth, disabled, style,
}: ButtonProps) {
  const palette = {
    primary:   { bg: tokens.primary,    fg: '#fff' },
    secondary: { bg: tokens.surface,    fg: tokens.text },
    tertiary:  { bg: 'transparent',     fg: tokens.primary, border: tokens.border },
    danger:    { bg: tokens.errorTint,  fg: tokens.error },
    ghost:     { bg: 'transparent',     fg: tokens.text },
  }[variant];

  const sizing = {
    sm: { h: 36, px: 14, fz: 13, ic: 14 },
    md: { h: 48, px: 18, fz: 15, ic: 18 },
    lg: { h: 56, px: 22, fz: 16, ic: 20 },
  }[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: sizing.h,
          paddingHorizontal: sizing.px,
          backgroundColor: palette.bg,
          borderWidth: palette.border ? 1.5 : 0,
          borderColor: palette.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {leftIcon && <Icon name={leftIcon} size={sizing.ic} color={palette.fg} />}
      <Text style={{ fontFamily: fonts.uiBold, fontSize: sizing.fz, color: palette.fg }}>
        {children}
      </Text>
      {rightIcon && <Icon name={rightIcon} size={sizing.ic} color={palette.fg} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radiusMd,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
