// Helpers de formatage pour aligner les réponses API sur la forme attendue par l'UI.

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

/** Date courte "21 Apr 2026" depuis une date ISO. */
export function shortDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Capitalise un identifiant de fonds ("general" → "General"). */
export function fundLabel(id: string): string {
  return id ? id.charAt(0).toUpperCase() + id.slice(1) : id;
}
