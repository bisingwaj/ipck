// Configuration de la couche API (branchement backend).
// Variables exposées au bundle via le préfixe EXPO_PUBLIC_*.
//
// Résolution de l'URL : EXPO_PUBLIC_API_URL est injecté depuis les fichiers .env
// selon le mode (Expo : .env, .env.<mode>, ...). En prod (eas build), .env.production
// fournit l'URL Railway. Le repli ci-dessous vise la PROD (et non localhost) pour
// qu'un build sans .env reste fonctionnel hors du réseau du développeur.
const PROD_API_URL = 'https://ipck-production.up.railway.app/api/v1';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? PROD_API_URL;

// Origine des fichiers statiques (vidéos auto-hébergées /media/...) :
// = l'API sans le suffixe de version /api/vN. Sert à résoudre les liens relatifs.
export const MEDIA_BASE = API_URL.replace(/\/api\/v\d+\/?$/, '');

// Bascule mock ↔ API réelle. true = fixtures locales (src/data/mock.ts).
export const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
