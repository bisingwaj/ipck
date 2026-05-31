// Instance HTTP : base URL + injection du token + refresh automatique sur 401.
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './config';
import { getItem, setItem, deleteItem, KEYS } from './storage';

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

api.interceptors.request.use(async (config) => {
  const token = await getItem(KEYS.access);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Routes qui ne doivent JAMAIS déclencher un refresh : le refresh lui-même et les
// routes pré-auth (otp/login/logout). ⚠️ /auth/me est PROTÉGÉE et DOIT pouvoir se
// rafraîchir — l'exclure provoquait une déconnexion dès l'expiration de l'access token.
function isPreAuthRoute(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/refresh') ||
    url.includes('/auth/otp') ||
    url.includes('/auth/logout')
  );
}

/** Vraie fin de session (refresh token absent/révoqué/expiré) → déconnexion. */
class SessionExpiredError extends Error {}

let refreshing: Promise<string> | null = null;

/**
 * Rafraîchit les tokens, avec déduplication stricte (une seule requête de refresh
 * en vol — `.finally` remet le verrou à zéro exactement une fois, évitant la
 * double-utilisation d'un refresh token à usage unique qui déconnecterait).
 *
 * - Lève `SessionExpiredError` UNIQUEMENT si le serveur rejette le refresh token
 *   (401/403) → la session est réellement terminée.
 * - Sur erreur réseau / 5xx / timeout : relève l'erreur SANS supprimer les tokens
 *   (cold start Railway, coupure passagère…) → la session est préservée.
 */
function refreshTokens(): Promise<string> {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = await getItem(KEYS.refresh);
      if (!refreshToken) throw new SessionExpiredError('no refresh token');
      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          { timeout: 15000 },
        );
        await setItem(KEYS.access, data.accessToken);
        await setItem(KEYS.refresh, data.refreshToken);
        return data.accessToken as string;
      } catch (e) {
        const status = (e as AxiosError).response?.status;
        if (status === 401 || status === 403) {
          // Refresh token invalide/révoqué → vraie fin de session.
          await deleteItem(KEYS.access);
          await deleteItem(KEYS.refresh);
          throw new SessionExpiredError('refresh rejected');
        }
        // Erreur transitoire (réseau/5xx/timeout) : on NE déconnecte PAS.
        throw e;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isPreAuthRoute(original.url)
    ) {
      original._retry = true;
      try {
        const newToken = await refreshTokens();
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        // Seule une vraie expiration de session renvoie vers l'authentification.
        // Une erreur transitoire laisse la session intacte (la requête échoue, c'est tout).
        if (e instanceof SessionExpiredError) onUnauthorized?.();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
