import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Filet de sécurité : si VITE_API_URL n'est pas défini au build, on cible le
// backend live Railway plutôt qu'un localhost injoignable (cause du Network Error).
const BASE_URL =
  import.meta.env.VITE_API_URL ?? 'https://ipck-production.up.railway.app/api/v1';

export const ACCESS_KEY = 'ipck_admin_token';
export const REFRESH_KEY = 'ipck_admin_refresh';

export const api = axios.create({ baseURL: BASE_URL });

export function setTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Refresh single-flight ────────────────────────────────────────────────
// Une seule requête de refresh à la fois ; les 401 concurrents attendent la
// même promesse, puis rejouent leur requête d'origine avec le nouveau token.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    // Instance nue : pas d'interceptors → pas de boucle de refresh.
    const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    clearTokens();
    return null;
  }
}

function redirectToLogin() {
  if (!location.pathname.startsWith('/login')) location.assign('/login');
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;

    // Pas un 401, pas de requête à rejouer, ou déjà retenté → on propage.
    if (status !== 401 || !original || original._retry) {
      if (status === 401) {
        clearTokens();
        redirectToLogin();
      }
      return Promise.reject(error);
    }

    // Ne pas tenter de rafraîchir sur l'endpoint de refresh lui-même.
    if (original.url?.includes('/auth/refresh')) {
      clearTokens();
      redirectToLogin();
      return Promise.reject(error);
    }

    original._retry = true;
    refreshing = refreshing ?? refreshAccessToken();
    const newToken = await refreshing.finally(() => {
      refreshing = null;
    });

    if (!newToken) {
      redirectToLogin();
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  },
);
