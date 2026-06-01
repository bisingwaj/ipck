import { AxiosError } from 'axios';

/**
 * Principe 1 (vérité serveur) & 6 (rien de silencieux) : on lit l'enveloppe
 * d'erreur normalisée du backend `{ statusCode, code, message }` et on la
 * traduit en un objet exploitable par l'UI — jamais d'erreur opaque.
 */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  /** Vrai si la requête n'a jamais atteint le serveur (réseau / timeout). */
  isNetwork: boolean;
  /** Vrai pour un conflit de version/état concurrent (principe 5). */
  isConflict: boolean;
}

interface ServerEnvelope {
  statusCode?: number;
  code?: string;
  message?: string;
}

const HUMAN_BY_CODE: Record<string, string> = {
  UNAUTHENTICATED: 'Session expirée — veuillez vous reconnecter.',
  FORBIDDEN: 'Vous n’avez pas les droits pour cette action.',
  NOT_FOUND: 'Élément introuvable — il a peut-être été supprimé entre-temps.',
  CONFLICT: 'Cet élément a changé depuis votre dernier chargement. Rechargez puis réessayez.',
  RATE_LIMITED: 'Trop de requêtes — patientez un instant puis réessayez.',
  VALIDATION_ERROR: 'Données invalides — vérifiez les champs et réessayez.',
  INTERNAL: 'Erreur serveur — réessayez ; si cela persiste, contactez l’équipe technique.',
};

/** Normalise n'importe quelle erreur (axios ou autre) en `ApiError`. */
export function toApiError(err: unknown): ApiError {
  const ax = err as AxiosError<ServerEnvelope> | undefined;

  // Réseau : la requête n'a pas abouti (pas de réponse serveur).
  if (ax?.isAxiosError && !ax.response) {
    return {
      status: 0,
      code: 'NETWORK',
      message: 'Serveur injoignable. Vérifiez votre connexion réseau puis réessayez.',
      isNetwork: true,
      isConflict: false,
    };
  }

  const status = ax?.response?.status ?? 0;
  const body = ax?.response?.data;
  const code = body?.code ?? defaultCode(status);
  const message = body?.message ?? HUMAN_BY_CODE[code] ?? genericMessage(status);

  return {
    status,
    code,
    message,
    isNetwork: false,
    isConflict: status === 409 || code === 'CONFLICT',
  };
}

/** Message humain de secours quand le backend n'a pas fourni de message. */
export function humanMessage(err: unknown): string {
  return toApiError(err).message;
}

function defaultCode(status: number): string {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'UNAUTHENTICATED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'RATE_LIMITED';
    default:
      return status >= 500 ? 'INTERNAL' : 'ERROR';
  }
}

function genericMessage(status: number): string {
  if (status >= 500) return HUMAN_BY_CODE.INTERNAL;
  if (status === 0) return 'Une erreur est survenue.';
  return `Une erreur est survenue (HTTP ${status}).`;
}
