// Enregistrement du token push Expo auprès du backend.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from './client';
import { USE_MOCKS } from './config';

/** Demande la permission, récupère le token Expo et l'envoie au backend. Non bloquant. */
export async function registerPushToken(): Promise<void> {
  if (USE_MOCKS) return;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    const tokenResp = await Notifications.getExpoPushTokenAsync();
    await api.post('/users/me/push-tokens', {
      expoToken: tokenResp.data,
      platform: Platform.OS,
    });
  } catch {
    // Push indisponible (Expo Go / pas de projectId EAS) — on n'interrompt pas l'onboarding.
  }
}
