import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Notification, Help, Logout } from '@carbon/icons-react';
import { useAuth } from '../auth/AuthContext';
import { useLang } from '../i18n';
import { NAV } from './ui';

/* ── Bouton de bascule de langue (FR ⇄ EN) — visible dans le header ── */
function LangToggle() {
  const { lang, toggle, t } = useLang();
  const next = lang === 'fr' ? 'EN' : 'FR';
  return (
    <button
      className="cds-header__action cds-langtoggle"
      onClick={toggle}
      title={t('header.lang')}
      aria-label={`${t('header.lang')} → ${next}`}
    >
      <span className={'cds-langtoggle__opt' + (lang === 'fr' ? ' is-on' : '')}>FR</span>
      <span className="cds-langtoggle__sep">/</span>
      <span className={'cds-langtoggle__opt' + (lang === 'en' ? ' is-on' : '')}>EN</span>
    </button>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { t } = useLang();
  const [rail, setRail] = useState(false);

  const initials =
    `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'IP';
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || t('header.staff');

  // Catégories groupées comme dans la maquette (UI Shell Carbon).
  // On groupe par clé i18n et on résout le libellé à l'affichage.
  const grouped: { categoryKey: string | null; items: typeof NAV }[] = [];
  for (const item of NAV) {
    const last = grouped[grouped.length - 1];
    if (last && last.categoryKey === item.categoryKey) last.items.push(item);
    else grouped.push({ categoryKey: item.categoryKey, items: [item] });
  }

  return (
    <div className={'cds-shell' + (rail ? ' is-rail' : '')}>
      {/* ── Header sombre ── */}
      <header className="cds-header">
        <button
          className="cds-header__menu"
          onClick={() => setRail((r) => !r)}
          aria-label={t('header.menu')}
        >
          <Menu size={20} />
        </button>
        <a className="cds-header__name" href="#" onClick={(e) => e.preventDefault()}>
          <span>IPCK House</span>
          <em>[Admin]</em>
        </a>
        <div className="cds-header__spacer" />
        <div className="cds-header__actions">
          <LangToggle />
          <button
            className="cds-header__action"
            title={t('header.notifications')}
            aria-label={t('header.notifications')}
          >
            <Notification size={20} />
            <span className="dot" />
          </button>
          <button className="cds-header__action" title={t('header.help')} aria-label={t('header.help')}>
            <Help size={20} />
          </button>
          <button className="cds-header__user" title={fullName}>
            <span className="cds-avatar">{initials}</span>
            <span className="cds-header__user-meta">
              <span>{fullName}</span>
              {user?.role && <small>{user.role}</small>}
            </span>
          </button>
          <button
            className="cds-header__action"
            title={t('header.logout')}
            aria-label={t('header.logout')}
            onClick={() => {
              signOut();
              navigate('/login');
            }}
          >
            <Logout size={20} />
          </button>
        </div>
      </header>

      {/* ── Side nav ── */}
      <aside className="cds-sidenav">
        <ul className="cds-sidenav__items">
          {grouped.map((sec, i) => (
            <li key={i} style={{ listStyle: 'none' }}>
              {sec.categoryKey && (
                <div className="cds-sidenav__category">{t(sec.categoryKey)}</div>
              )}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {sec.items.map((it) => {
                  const Icon = it.icon;
                  const active = location.pathname === it.path;
                  const label = t(it.labelKey);
                  return (
                    <li key={it.id}>
                      <button
                        className={'cds-sidenav__item' + (active ? ' is-active' : '')}
                        onClick={() => navigate(it.path)}
                        title={rail ? label : undefined}
                      >
                        <span className="cds-sidenav__item-icon">
                          <Icon size={20} />
                        </span>
                        <span className="cds-sidenav__item-label">{label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
        <div className="cds-sidenav__footer">
          <span className="cds-status-dot cds-status-dot--ok" />
          <span>{t('sidenav.systemsOk')}</span>
        </div>
      </aside>

      {/* ── Zone principale ── */}
      <main className="cds-main">{children}</main>
    </div>
  );
}
