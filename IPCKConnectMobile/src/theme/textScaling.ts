import { Text, TextInput } from 'react-native';

// Global Dynamic Type guard — caps how far the OS "large text" setting can blow
// up our typography before layouts break, while still RESPECTING the user's
// accessibility preference (we cap, we don't disable). Importing this module for
// its side effect (in App.tsx, before the tree renders) bounds every <Text> and
// <TextInput> app-wide. <AppText> applies the same cap explicitly for call sites
// that also need a `clamp`.
//
// 1.4 ≈ enough headroom for real accessibility needs without titles overflowing.
const MAX = 1.4;

type Defaultable = { defaultProps?: { maxFontSizeMultiplier?: number } };

(Text as unknown as Defaultable).defaultProps = {
  ...(Text as unknown as Defaultable).defaultProps,
  maxFontSizeMultiplier: MAX,
};

(TextInput as unknown as Defaultable).defaultProps = {
  ...(TextInput as unknown as Defaultable).defaultProps,
  maxFontSizeMultiplier: MAX,
};
