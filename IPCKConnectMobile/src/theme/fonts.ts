import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

// Drop IBM Plex .ttf files into assets/fonts/ and uncomment to use them.
// Without them, the app falls back to System fonts and still renders cleanly.
export function useLoadFonts() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          // 'IBMPlexSans':           require('../../assets/fonts/IBMPlexSans-Regular.ttf'),
          // 'IBMPlexSans-Medium':    require('../../assets/fonts/IBMPlexSans-Medium.ttf'),
          // 'IBMPlexSans-Bold':      require('../../assets/fonts/IBMPlexSans-Bold.ttf'),
          // 'IBMPlexSerif':          require('../../assets/fonts/IBMPlexSerif-Regular.ttf'),
          // 'IBMPlexSerif-Medium':   require('../../assets/fonts/IBMPlexSerif-Medium.ttf'),
          // 'IBMPlexSerif-SemiBold': require('../../assets/fonts/IBMPlexSerif-SemiBold.ttf'),
          // 'IBMPlexSerif-Italic':   require('../../assets/fonts/IBMPlexSerif-Italic.ttf'),
          // 'IBMPlexMono':           require('../../assets/fonts/IBMPlexMono-Regular.ttf'),
        });
      } catch (e) { /* fall back */ }
      finally { setLoaded(true); }
    })();
  }, []);
  return loaded;
}
