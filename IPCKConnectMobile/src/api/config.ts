// Configuration de la couche API (branchement backend).
// Variables exposées au bundle via le préfixe EXPO_PUBLIC_*.

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3333/api/v1';

// Origine des fichiers statiques (vidéos auto-hébergées /media/...) :
// = l'API sans le suffixe de version /api/vN. Sert à résoudre les liens relatifs.
export const MEDIA_BASE = API_URL.replace(/\/api\/v\d+\/?$/, '');

// Bascule mock ↔ API réelle. true = fixtures locales (src/data/mock.ts).
export const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
