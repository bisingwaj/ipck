import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 min : une fois chargée, la donnée reste « fraîche » → pas de refetch (ni
      // flash) à chaque entrée d'écran. Les mutations invalident les clés concernées,
      // donc l'écran reste à jour après une action (don, top-up…).
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // ne pas re-fetcher si la donnée est déjà en cache (anti-flash)
    },
  },
});
