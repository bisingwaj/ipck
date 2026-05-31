// Vérification RÉELLE du correctif de session contre le backend live.
// Reproduit fidèlement la logique de l'interceptor de src/api/client.ts
// (mêmes conditions: isPreAuthRoute, dédup .finally, 3 essais transitoires,
// SessionExpiredError → onUnauthorized) et exécute le scénario exact rapporté :
// 1ère connexion → access expiré → confirmation Give/Top-up → ne doit PAS déconnecter.
import axios from 'axios';

const API_URL = 'https://ipck-production.up.railway.app/api/v1';

// ---- fausse SecureStore (Map en mémoire) ----
const KEYS = { access: 'a', refresh: 'r' };
let store = new Map();
const getItem = async (k) => (store.has(k) ? store.get(k) : null);
const setItem = async (k, v) => void store.set(k, v);
const deleteItem = async (k) => void store.delete(k);

// ---- compteurs d'observation ----
let unauthorizedCount = 0;
let refreshHttpCount = 0;
const onUnauthorized = () => { unauthorizedCount++; };

// ---- transport de refresh (permet l'injection de pannes transitoires) ----
let refreshFaultsRemaining = 0; // nb d'échecs réseau à simuler avant succès
async function refreshTransport(body) {
  refreshHttpCount++;
  if (refreshFaultsRemaining > 0) {
    refreshFaultsRemaining--;
    throw new axios.AxiosError('simulated network error', 'ECONNRESET'); // pas de .response → transitoire
  }
  return axios.post(`${API_URL}/auth/refresh`, body, { timeout: 15000 });
}

// =================== COPIE FIDÈLE DE client.ts ===================
const api = axios.create({ baseURL: API_URL, timeout: 15000 });
api.interceptors.request.use(async (config) => {
  try {
    const token = await getItem(KEYS.access);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function isPreAuthRoute(url) {
  if (!url) return false;
  return url.includes('/auth/refresh') || url.includes('/auth/otp') || url.includes('/auth/logout');
}
class SessionExpiredError extends Error {}
let refreshing = null;
function refreshTokens() {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = await getItem(KEYS.refresh);
      if (!refreshToken) throw new SessionExpiredError('no refresh token');
      let lastErr;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data } = await refreshTransport({ refreshToken });
          await setItem(KEYS.access, data.accessToken);
          await setItem(KEYS.refresh, data.refreshToken);
          return data.accessToken;
        } catch (e) {
          const status = e?.response?.status;
          if (status === 401 || status === 403) {
            await deleteItem(KEYS.access);
            await deleteItem(KEYS.refresh);
            throw new SessionExpiredError('refresh rejected');
          }
          lastErr = e;
          if (attempt < 2) await sleep(700 * (attempt + 1));
        }
      }
      throw lastErr;
    })().finally(() => { refreshing = null; });
  }
  return refreshing;
}
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry && !isPreAuthRoute(original.url)) {
      original._retry = true;
      try {
        const usedToken = typeof original.headers?.Authorization === 'string'
          ? original.headers.Authorization.replace('Bearer ', '') : null;
        const current = await getItem(KEYS.access);
        const newToken = current && current !== usedToken ? current : await refreshTokens();
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        if (e instanceof SessionExpiredError) onUnauthorized();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
// ================================================================

// helper : obtenir une vraie paire de tokens (nouvel utilisateur)
async function newUserTokens() {
  const phone = '+24397' + Math.floor(1000000 + Math.random() * 8999999);
  const { data } = await axios.post(`${API_URL}/auth/otp/verify`, { phone, code: '000000' });
  return { phone, ...data };
}
function reset() { store = new Map(); unauthorizedCount = 0; refreshHttpCount = 0; refreshFaultsRemaining = 0; refreshing = null; }
const ok = (c) => (c ? 'PASS' : 'FAIL');
let allPass = true;
function assert(name, cond, detail = '') { if (!cond) allPass = false; console.log(`  [${ok(cond)}] ${name}${detail ? ' — ' + detail : ''}`); }

async function run() {
  console.log('=== Vérification du correctif de session (backend live) ===\n');

  // A. Première connexion, tokens valides → Top-up à la confirmation
  { reset();
    const t = await newUserTokens();
    store.set(KEYS.access, t.accessToken); store.set(KEYS.refresh, t.refreshToken);
    const r = await api.post('/giving/wallet/topup', { coins: 25, method: 'mpesa' }).then(x => x.status).catch(e => e.response?.status);
    console.log('A. 1ère connexion (token valide) → confirmation Top-up');
    assert('top-up réussit', r === 201 || r === 200, 'http ' + r);
    assert('aucune déconnexion', unauthorizedCount === 0);
  }

  // B. LE BUG : access expiré/invalide + refresh valide → Give à la confirmation
  { reset();
    const t = await newUserTokens();
    store.set(KEYS.access, 'expired.garbage.token'); // simule l'access expiré
    store.set(KEYS.refresh, t.refreshToken);          // refresh encore valide
    const r = await api.post('/giving/donations', { amount: 10, fundId: 'building', method: 'mpesa' }).then(x => x.status).catch(e => e.response?.status);
    console.log('\nB. Access EXPIRÉ + refresh valide → confirmation Give (le scénario rapporté)');
    assert('le don récupère via refresh', r === 201 || r === 200, 'http ' + r);
    assert('refresh appelé 1x', refreshHttpCount === 1, refreshHttpCount + ' appels');
    assert('AUCUN retour à l’auth', unauthorizedCount === 0);
  }

  // C. Requêtes concurrentes (home) avec access expiré → un seul refresh, pas de déconnexion
  { reset();
    const t = await newUserTokens();
    store.set(KEYS.access, 'expired.garbage.token'); store.set(KEYS.refresh, t.refreshToken);
    const eps = ['/giving/wallet', '/giving/funds', '/devotionals/today', '/content', '/events'];
    const codes = await Promise.all(eps.map(e => api.get(e).then(x => x.status).catch(er => er.response?.status)));
    console.log('\nC. 5 requêtes concurrentes avec access expiré (dédup refresh)');
    assert('toutes récupèrent (2xx)', codes.every(c => c >= 200 && c < 300), 'codes ' + codes.join(','));
    assert('UN SEUL refresh (dédup)', refreshHttpCount === 1, refreshHttpCount + ' appels');
    assert('aucune déconnexion', unauthorizedCount === 0);
  }

  // D. À-coup réseau pendant le refresh (mobilité) → réessaie, pas de déconnexion
  { reset();
    const t = await newUserTokens();
    store.set(KEYS.access, 'expired.garbage.token'); store.set(KEYS.refresh, t.refreshToken);
    refreshFaultsRemaining = 2; // 2 échecs réseau puis succès
    const r = await api.post('/giving/wallet/topup', { coins: 5, method: 'mpesa' }).then(x => x.status).catch(e => e.response?.status);
    console.log('\nD. À-coup réseau pendant le refresh (2 échecs puis succès)');
    assert('la requête finit par réussir', r === 201 || r === 200, 'http ' + r);
    assert('3 tentatives de refresh', refreshHttpCount === 3, refreshHttpCount + ' appels');
    assert('AUCUN retour à l’auth malgré le réseau', unauthorizedCount === 0);
  }

  // E. Vraie expiration de session (refresh invalide) → déconnexion attendue, une seule fois
  { reset();
    store.set(KEYS.access, 'expired.garbage.token'); store.set(KEYS.refresh, 'invalid.refresh.token');
    const r = await api.get('/giving/wallet').then(x => x.status).catch(e => e.response?.status);
    console.log('\nE. Vraie fin de session (refresh invalide) → doit déconnecter');
    assert('requête rejetée', r === 401, 'http ' + r);
    assert('onUnauthorized déclenché 1x', unauthorizedCount === 1, unauthorizedCount + 'x');
  }

  console.log('\n=== RÉSULTAT GLOBAL : ' + (allPass ? '✅ TOUT PASSE' : '❌ ÉCHEC') + ' ===');
  process.exit(allPass ? 0 : 1);
}
run().catch((e) => { console.error('ERREUR HARNAIS:', e.message); process.exit(2); });
