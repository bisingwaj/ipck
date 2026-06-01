import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { FeedbackProvider } from './components/feedback';
import { toApiError } from './api/errors';
import './index.scss';

// Principe 1 & 2 : la donnée vient du serveur et son cycle est explicite.
// - staleTime court : les vues se rafraîchissent quand on y revient (anti-obsolescence).
// - refetchOnWindowFocus : resync quand l'admin revient sur l'onglet.
// - retry : on retente les erreurs transitoires, mais jamais un 4xx (réponse serveur
//   définitive — afficher l'erreur plutôt que marteler).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        const e = toApiError(error);
        if (e.isNetwork) return failureCount < 2;
        if (e.status >= 400 && e.status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: { retry: false },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <FeedbackProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </FeedbackProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
