import { AxiosError } from 'axios';

/** Extrait un message lisible de l'enveloppe d'erreur { statusCode, code, message }. */
export function apiMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  const e = error as AxiosError<{ message?: string }>;
  return e?.response?.data?.message ?? e?.message ?? fallback;
}
