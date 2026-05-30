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

let refreshing: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
  const refreshToken = await getItem(KEYS.refresh);
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    await setItem(KEYS.access, data.accessToken);
    await setItem(KEYS.refresh, data.refreshToken);
    return data.accessToken as string;
  } catch {
    await deleteItem(KEYS.access);
    await deleteItem(KEYS.refresh);
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthRoute = original?.url?.includes('/auth/');
    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      refreshing = refreshing ?? refreshTokens();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);
