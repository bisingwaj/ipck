// Helpers de formatage pour aligner les réponses API sur la forme attendue par l'UI.
import { MEDIA_BASE } from './config';

const AVATAR_COLORS = ['#1F6FEB', '#FFB020', '#1FB36A', '#5B3FB8', '#E5484D', '#0FA38C', '#6A7384'];

/** Couleur d'avatar déterministe à partir d'une chaîne (id/nom). */
export function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/** Temps relatif court ("2 min", "3 h", "5 d") depuis une date ISO. */
export function ago(iso?: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} d`;
}

/**
 * Libellé de date d'une dévotion, dérivé de `publishAt` (ISO fiable).
 * Aujourd'hui → "Today · 24 May", hier → "Yesterday · 23 May", sinon date complète
 * "Sunday, 24 May 2026". `fallback` (le champ `date` libre du backend) si pas d'ISO valide.
 */
export function devotionalDate(iso?: string, fallback?: string): string {
  if (!iso) return fallback ?? '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback ?? iso;
  const startOf = (x: Date) => { const c = new Date(x); c.setHours(0, 0, 0, 0); return c.getTime(); };
  const diffDays = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000);
  const dayMonth = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  if (diffDays === 0) return `Today · ${dayMonth}`;
  if (diffDays === 1) return `Yesterday · ${dayMonth}`;
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Date courte "21 Apr 2026" depuis une date ISO. */
export function shortDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Résout un lien vidéo lisible par le lecteur natif (expo-video).
 * - URL absolue (HLS .m3u8 / MP4 externe) → renvoyée telle quelle.
 * - Chemin relatif `/media/...` (vidéo auto-hébergée) → préfixé par l'origine de l'API.
 */
export function resolveMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${MEDIA_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Libellé lisible d'une catégorie de contenu ("worship" → "Worship"). */
const CATEGORY_LABELS: Record<string, string> = {
  sermon: 'Sermons',
  podcast: 'Podcasts',
  teaching: 'Teachings',
  worship: 'Worship',
  testimony: 'Testimonies',
  other: 'More',
};
export function categoryLabel(category?: string): string {
  if (!category) return 'More';
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

/** Capitalise un identifiant de fonds ("general" → "General"). */
export function fundLabel(id: string): string {
  return id ? id.charAt(0).toUpperCase() + id.slice(1) : id;
}

/** Libellé d'une transaction « reward » (Blessings gagnés) selon sa source. */
export function rewardLabel(service?: string): string {
  if (service?.startsWith('devo')) return 'Daily verse · earned';
  if (service?.startsWith('prayer')) return 'Prayer support · earned';
  return 'Blessings earned';
}

/** Libellé date+heure d'un créneau de RDV depuis une date ISO. */
export function apptWhen(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
}

/**
 * Décompose un événement en { day, month, time } pour la pastille de date.
 * Source fiable = `startsAt` (ISO). Fallback = parsing du label `when`
 * (format mock "Fri 29 May · 7:00 PM"). Le whenLabel réel ("Fri · 7:00 PM")
 * n'a pas de date du mois → on s'appuie sur startsAt.
 */
export function eventDateParts(e: { when?: string; startsAt?: string }): { day: string; month: string; time: string } {
  const label = e.when ?? '';
  const time = label.includes('·') ? label.split('·').pop()!.trim() : label.trim();
  if (e.startsAt) {
    const d = new Date(e.startsAt);
    if (!Number.isNaN(d.getTime())) {
      return {
        day: String(d.getDate()),
        month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        time: time || d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
    }
  }
  // Fallback label "Fri 29 May · 7:00 PM"
  return {
    day: label.match(/\d+/)?.[0] ?? '',
    month: (label.split(' ')[2] ?? '').toUpperCase(),
    time,
  };
}
