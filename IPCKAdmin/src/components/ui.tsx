import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  t,
  currentLang,
  STATUS_MAP,
  ROLE_MAP,
  CATEGORY_MAP,
  type Tone as I18nTone,
} from '../i18n';
import {
  Dashboard,
  Favorite,
  Money,
  Video,
  UserMultiple,
  Group,
  Book,
  SendAlt,
  Activity,
  ChevronRight,
  User,
} from '@carbon/icons-react';

/* ───────────────────────────────────────────────────────────────
   Navigation partagée — pilote la side nav (AppShell) et les tabs
   (PageHead). `labelKey`/`categoryKey` sont des clés i18n résolues à
   l'affichage via t() : la nav devient bilingue sans dupliquer la liste.
   ─────────────────────────────────────────────────────────────── */
export interface NavItem {
  id: string;
  path: string;
  /** Clé i18n du libellé (résolue par t() à l'affichage). */
  labelKey: string;
  icon: typeof Dashboard;
  /** Clé i18n de la catégorie, ou null (élément hors catégorie). */
  categoryKey: string | null;
}

export const NAV: NavItem[] = [
  { id: 'overview', path: '/', labelKey: 'nav.overview', icon: Dashboard, categoryKey: null },
  { id: 'care', path: '/care', labelKey: 'nav.care', icon: Favorite, categoryKey: 'nav.cat.community' },
  { id: 'people', path: '/people', labelKey: 'nav.people', icon: UserMultiple, categoryKey: 'nav.cat.community' },
  { id: 'community', path: '/community', labelKey: 'nav.community', icon: Group, categoryKey: 'nav.cat.community' },
  { id: 'giving', path: '/giving', labelKey: 'nav.giving', icon: Money, categoryKey: 'nav.cat.finance' },
  { id: 'content', path: '/content', labelKey: 'nav.content', icon: Video, categoryKey: 'nav.cat.content' },
  { id: 'devotions', path: '/devotions', labelKey: 'nav.devotions', icon: Book, categoryKey: 'nav.cat.content' },
  { id: 'communications', path: '/communications', labelKey: 'nav.communications', icon: SendAlt, categoryKey: 'nav.cat.broadcast' },
  { id: 'activity', path: '/activity', labelKey: 'nav.activity', icon: Activity, categoryKey: 'nav.cat.supervision' },
];

/* ── Tag / pill ── */
export type Tone = I18nTone;

export function Tag({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`cds-tag cds-tag--${tone}`}>{children}</span>;
}

export function LiveTag({ children = 'LIVE' }: { children?: ReactNode }) {
  return <span className="cds-tag cds-tag--live">{children}</span>;
}

/* ── StatusBadge — source unique de vérité statut → couleur + libellé bilingue ──
   Les libellés FR/EN vivent dans i18n (STATUS_MAP) ; on choisit selon la langue. */
export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_MAP[status];
  return <Tag tone={m?.tone ?? 'gray'}>{statusLabel(status)}</Tag>;
}

/** Libellé localisé d'un statut (pour les phrases descriptives), sans le badge. */
export function statusLabel(status: string): string {
  const m = STATUS_MAP[status];
  return m ? m[currentLang()] : status;
}

/* ── Rôles : libellé + couleur bilingues (miroir des rôles backend) ── */
export function RoleBadge({ role }: { role: string }) {
  const m = ROLE_MAP[role];
  return <Tag tone={m?.tone ?? 'gray'}>{roleLabel(role)}</Tag>;
}
export function roleLabel(role: string): string {
  const m = ROLE_MAP[role];
  return m ? m[currentLang()] : role;
}

/* ── Catégories de contenu : libellé bilingue (miroir de l'enum backend) ── */
export function categoryLabel(category: string): string {
  const m = CATEGORY_MAP[category];
  return m ? m[currentLang()] : category;
}
export function CategoryBadge({ category }: { category: string }) {
  return <Tag tone="gray">{categoryLabel(category)}</Tag>;
}

/* ── Avatar à initiales (couleur déterministe ou imposée) ── */
const AVATAR_COLORS = ['#0f62fe', '#8a3ffc', '#007d79', '#d02670', '#1192e8', '#fa4d56', '#6f6f6f'];
function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
export function Avatar({
  name,
  color,
  size = 32,
}: {
  name: string;
  color?: string | null;
  size?: number;
}) {
  // N'extrait que des LETTRES (ignore +, chiffres d'un téléphone, ponctuation).
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w.match(/\p{L}/u)?.[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('');
  return (
    <span
      className="cds-avatar2"
      style={{
        background: color || colorFor(name),
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
      aria-hidden
    >
      {initials || <User size={size * 0.55} />}
    </span>
  );
}

/* ── Thumb — vignette de contenu (image) ou placeholder à icône ── */
export function Thumb({
  src,
  icon,
  alt = '',
}: {
  src?: string | null;
  icon?: ReactNode;
  alt?: string;
}) {
  if (src) {
    return <span className="cds-thumb" style={{ backgroundImage: `url(${src})` }} role="img" aria-label={alt} />;
  }
  return <span className="cds-thumb cds-thumb--empty">{icon}</span>;
}

/* ── Meter — barre de progression vs cible (engagement, capacité…) ── */
export function Meter({
  pct,
  target,
  tone = 'blue',
}: {
  pct: number;
  target?: number;
  tone?: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="cds-meter">
      <div className="cds-meter__track">
        <div className={`cds-meter__fill cds-meter__fill--${tone}`} style={{ width: `${clamped}%` }} />
        {target != null && (
          <div className="cds-meter__target" style={{ left: `${Math.min(100, target)}%` }} />
        )}
      </div>
    </div>
  );
}

/* ── KPI tile (tuile plate Carbon avec delta optionnel) ── */
export function Tile({
  label,
  value,
  delta,
  deltaType = 'pct',
  good,
  caption,
  live,
  icon,
  onClick,
  children,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: number;
  deltaType?: 'pct' | 'abs';
  good?: boolean;
  caption?: ReactNode;
  live?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const cls =
    delta == null ? 'flat' : delta > 0 ? (good ? 'up' : 'down') : good ? 'down' : 'up';
  const sign = delta != null && delta > 0 ? '+' : '';
  return (
    <div
      className={'cds-tile' + (onClick ? ' cds-tile--clickable' : '')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="cds-tile__label">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {icon && <span className="cds-tile__icon">{icon}</span>}
          {label}
        </span>
        {live && <LiveTag />}
      </div>
      <div className="cds-tile__value">
        <span>{value}</span>
        {delta != null && (
          <span className={`cds-tile__delta ${cls}`}>
            {delta > 0 ? <ArrowUpMini /> : <ArrowDownMini />}
            {sign}
            {delta}
            {deltaType === 'pct' ? '%' : ''}
          </span>
        )}
      </div>
      {children}
      {caption != null && <div className="cds-tile__caption">{caption}</div>}
    </div>
  );
}

function ArrowUpMini() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 3l5 5-1 1-3.3-3.3V13H7.3V5.7L4 9 3 8z" />
    </svg>
  );
}
function ArrowDownMini() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 13L3 8l1-1 3.3 3.3V3h1.4v7.3L12 7l1 1z" />
    </svg>
  );
}

/* ── Panel (carte plate avec en-tête optionnel) ── */
export function Panel({
  title,
  sub,
  actions,
  children,
  style,
}: {
  title?: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="cds-panel" style={style}>
      {(title || actions) && (
        <div className="cds-panel__head">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <div className="cds-tile__caption sub">{sub}</div>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── PageHead — fil d'Ariane + titre + sous-titre + actions + tabs ── */
export function PageHead({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div className="cds-page-head">
      <div className="cds-breadcrumb">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          IPCK House
        </a>
        <span className="sep">/</span>
        <span>{t('app.admin')}</span>
        <span className="sep">/</span>
        <span>{title}</span>
      </div>
      <div className="cds-page-title-row">
        <div>
          <h1 className="cds-page-title">{title}</h1>
          {subtitle && <p className="cds-page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="cds-page-actions">{actions}</div>}
      </div>
      <div className="cds-tabs" role="tablist">
        {NAV.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              className={'cds-tab' + (active ? ' is-active' : '')}
              onClick={() => navigate(tab.path)}
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Empty enrichi : icône optionnelle + action optionnelle ── */
export function Empty({
  children,
  icon,
  action,
}: {
  children: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="cds-empty">
      {icon && <div className="cds-empty__icon">{icon}</div>}
      <div className="cds-empty__text">{children}</div>
      {action && <div className="cds-empty__action">{action}</div>}
    </div>
  );
}

export { ChevronRight };
