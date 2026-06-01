import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Notification, Help, Logout } from '@carbon/icons-react';
import { useAuth } from '../auth/AuthContext';
import { NAV } from './ui';

export default function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [rail, setRail] = useState(false);

  const initials =
    `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'IP';
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Staff';

  // Catégories groupées comme dans la maquette (UI Shell Carbon).
  const grouped: { label: string | null; items: typeof NAV }[] = [];
  for (const item of NAV) {
    const last = grouped[grouped.length - 1];
    if (last && last.label === item.category) last.items.push(item);
    else grouped.push({ label: item.category, items: [item] });
  }

  return (
    <div className={'cds-shell' + (rail ? ' is-rail' : '')}>
      {/* ── Header sombre ── */}
      <header className="cds-header">
        <button
          className="cds-header__menu"
          onClick={() => setRail((r) => !r)}
          aria-label="Basculer le menu"
        >
          <Menu size={20} />
        </button>
        <a className="cds-header__name" href="#" onClick={(e) => e.preventDefault()}>
          <span>IPCK House</span>
          <em>[Admin]</em>
        </a>
        <div className="cds-header__spacer" />
        <div className="cds-header__actions">
          <button className="cds-header__action" title="Notifications" aria-label="Notifications">
            <Notification size={20} />
            <span className="dot" />
          </button>
          <button className="cds-header__action" title="Aide" aria-label="Aide">
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
            title="Déconnexion"
            aria-label="Déconnexion"
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
              {sec.label && <div className="cds-sidenav__category">{sec.label}</div>}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {sec.items.map((it) => {
                  const Icon = it.icon;
                  const active = location.pathname === it.path;
                  return (
                    <li key={it.id}>
                      <button
                        className={'cds-sidenav__item' + (active ? ' is-active' : '')}
                        onClick={() => navigate(it.path)}
                        title={rail ? it.label : undefined}
                      >
                        <span className="cds-sidenav__item-icon">
                          <Icon size={20} />
                        </span>
                        <span className="cds-sidenav__item-label">{it.label}</span>
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
          <span>Tous les systèmes opérationnels</span>
        </div>
      </aside>

      {/* ── Zone principale ── */}
      <main className="cds-main">{children}</main>
    </div>
  );
}
