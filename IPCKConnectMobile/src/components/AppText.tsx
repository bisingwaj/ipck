import React from 'react';
import { Text, TextProps } from 'react-native';

// Shared text primitive — bounds Dynamic Type scaling app-wide and exposes a
// `clamp` shortcut so titles never silently overflow / truncate without intent.
//
//   <AppText clamp={1} style={styles.rowTitle}>{title}</AppText>   // 1 line + ellipsis
//   <AppText clamp={2} style={styles.cardTitle}>{title}</AppText>  // 2 lines + ellipsis
//   <AppText style={styles.heading}>{title}</AppText>              // wraps freely, scaling bounded
//
// Migration is incremental — plain <Text> stays valid; reach for <AppText>
// whenever you add or touch a title / heading / list-row label.

type Clamp = 1 | 2 | 3 | 'none';

export interface AppTextProps extends TextProps {
  /** Truncate to N lines with a trailing ellipsis. `'none'` (default) wraps freely. */
  clamp?: Clamp;
}

export function AppText({ clamp = 'none', maxFontSizeMultiplier = 1.4, ...rest }: AppTextProps) {
  const truncation: Pick<TextProps, 'numberOfLines' | 'ellipsizeMode'> =
    clamp === 'none' ? {} : { numberOfLines: clamp, ellipsizeMode: 'tail' };
  return <Text maxFontSizeMultiplier={maxFontSizeMultiplier} {...truncation} {...rest} />;
}
