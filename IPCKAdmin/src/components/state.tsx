import { ReactNode } from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { Loading } from '@carbon/react';
import { Renew, WarningAlt, CloudOffline } from '@carbon/icons-react';
import { toApiError } from '../api/errors';

/**
 * Principe 2 (cycle d'état explicite) & 6 (rien de silencieux) :
 * un seul composant rend TOUS les états d'une requête serveur —
 * loading → error (avec réessayer) → empty → success — pour qu'aucun écran
 * ne soit jamais ambigu. La donnée affichée vient toujours du serveur (principe 1).
 */
interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
  /** Considère le résultat comme « vide » (affiche l'état vide au lieu de children). */
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  loadingLabel?: string;
}

export function QueryBoundary<T>({
  query,
  children,
  isEmpty,
  empty,
  loadingLabel,
}: QueryBoundaryProps<T>) {
  // 1) Chargement initial (aucune donnée encore).
  if (query.isLoading) {
    return (
      <div className="cds-state cds-state--loading">
        <Loading withOverlay={false} small description={loadingLabel} />
        {loadingLabel && <span className="cds-state__label">{loadingLabel}</span>}
      </div>
    );
  }

  // 2) Erreur (sans donnée en cache à montrer).
  if (query.isError && query.data === undefined) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }

  // 3) Vide.
  if (query.data !== undefined && isEmpty?.(query.data)) {
    return <>{empty ?? <div className="cds-empty">Aucune donnée.</div>}</>;
  }

  // 4) Succès (data garantie définie ici).
  return <>{query.data !== undefined ? children(query.data) : null}</>;
}

/** État d'erreur explicite avec bouton « Réessayer » (jamais d'échec muet). */
export function ErrorState({
  error,
  onRetry,
  retrying,
}: {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const e = toApiError(error);
  const Icon = e.isNetwork ? CloudOffline : WarningAlt;
  return (
    <div className="cds-state cds-state--error" role="alert">
      <span className="cds-state__icon">
        <Icon size={24} />
      </span>
      <div className="cds-state__body">
        <div className="cds-state__title">
          {e.isNetwork ? 'Connexion impossible' : 'Échec du chargement'}
        </div>
        <div className="cds-state__msg">{e.message}</div>
      </div>
      {onRetry && (
        <button className="cds-btn cds-btn--ghost cds-btn--sm" onClick={onRetry} disabled={retrying}>
          {retrying ? 'Nouvel essai…' : 'Réessayer'}
          <Renew size={16} />
        </button>
      )}
    </div>
  );
}

/**
 * Principe 6 : signale qu'une donnée affichée est en cours de rafraîchissement
 * ou potentiellement obsolète (refetch en arrière-plan), sans masquer la donnée.
 */
export function FreshnessBadge({ query }: { query: UseQueryResult<unknown> }) {
  if (query.isFetching && !query.isLoading) {
    return (
      <span className="cds-fresh cds-fresh--syncing" title="Synchronisation avec le serveur">
        <Renew size={12} /> Actualisation…
      </span>
    );
  }
  if (query.isError && query.data !== undefined) {
    return (
      <span className="cds-fresh cds-fresh--stale" title="La dernière synchronisation a échoué">
        <WarningAlt size={12} /> Données possiblement obsolètes
      </span>
    );
  }
  return null;
}
