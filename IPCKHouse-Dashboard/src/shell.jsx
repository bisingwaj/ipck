// IPCK House — Carbon UI Shell components (Header + SideNav)

function CHeader({ onMenu }) {
  return (
    <header className="cds-header">
      <button className="cds-header__menu" onClick={onMenu} aria-label="Open menu">
        <CIcon name="menu" size={20} color="#fff"/>
      </button>
      <a className="cds-header__name" href="#">
        <span>IPCK House</span>
        <em>[Admin]</em>
      </a>
      <nav className="cds-header__nav">
        <a href="#" className="is-active">Dashboard</a>
        <a href="#">People</a>
        <a href="#">Content</a>
        <a href="#">Finance</a>
        <a href="#">Settings</a>
      </nav>
      <div className="cds-header__spacer"/>
      <div className="cds-header__actions">
        <button className="cds-header__action" title="Search"><CIcon name="search" size={20} color="#fff"/></button>
        <button className="cds-header__action" title="Notifications">
          <CIcon name="notification" size={20} color="#fff"/>
          <span className="dot"/>
        </button>
        <button className="cds-header__action" title="Help"><CIcon name="help" size={20} color="#fff"/></button>
        <button className="cds-header__action" title="App switcher"><CIcon name="switcher" size={20} color="#fff"/></button>
        <button className="cds-header__user">
          <span className="cds-avatar">{DATA.user.initials}</span>
        </button>
      </div>
    </header>
  );
}

function CSideNav({ active, onNav, rail }) {
  const sections = [
    { label: null, items: [
      { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
      { id: 'live',      icon: 'live',      label: 'Live console',   count: { txt: 'LIVE', kind: 'live' } },
    ]},
    { label: 'People', items: [
      { id: 'members', icon: 'members', label: 'Members',             count: { txt: '1,284' } },
      { id: 'groups',  icon: 'groups',  label: 'Groups & ministries', count: { txt: '14' } },
    ]},
    { label: 'Content', items: [
      { id: 'sermons',     icon: 'sermons', label: 'Sermons' },
      { id: 'devotionals', icon: 'devo',    label: 'Devotionals' },
    ]},
    { label: 'Community', items: [
      { id: 'prayer', icon: 'prayer', label: 'Prayer wall',  count: { txt: '6', kind: 'live' } },
      { id: 'events', icon: 'events', label: 'Events' },
      { id: 'appts',  icon: 'appts',  label: 'Appointments', count: { txt: '5' } },
    ]},
    { label: 'Finance', items: [
      { id: 'giving', icon: 'give',  label: 'Giving' },
      { id: 'funds',  icon: 'funds', label: 'Funds' },
    ]},
    { label: 'Engagement', items: [
      { id: 'broadcasts', icon: 'broadcast', label: 'Broadcasts' },
      { id: 'insights',   icon: 'insights',  label: 'Insights' },
    ]},
  ];

  return (
    <aside className="cds-sidenav">
      <ul className="cds-sidenav__items">
        {sections.map((sec, i) => (
          <React.Fragment key={i}>
            {sec.label && <li className="cds-sidenav__category">{sec.label}</li>}
            {sec.items.map(it => (
              <li key={it.id}>
                <button
                  className={'cds-sidenav__item' + (active === it.id ? ' is-active' : '')}
                  onClick={() => onNav && onNav(it.id)}
                  title={rail ? it.label : undefined}
                >
                  <span className="cds-sidenav__item-icon"><CIcon name={it.icon} size={20}/></span>
                  <span className="cds-sidenav__item-label">{it.label}</span>
                  {it.count && (
                    <span className={'cds-sidenav__count' + (it.count.kind === 'live' ? ' is-live' : '')}>
                      {it.count.txt}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </React.Fragment>
        ))}
      </ul>
      <div className="cds-sidenav__footer">
        <span className="cds-status-dot cds-status-dot--ok"/>
        <span>All systems operational</span>
      </div>
    </aside>
  );
}

window.CHeader = CHeader;
window.CSideNav = CSideNav;

/* ─────────────────────────────────────────────────────────────
   Shared small primitives used across tab panels
   ───────────────────────────────────────────────────────────── */

function CTile({ label, value, delta, deltaType, good, caption, spark, live, onClick }) {
  const cls =
    delta == null ? 'flat' :
    (delta > 0 ? (good ? 'up' : 'down') : (good ? 'down' : 'up'));
  const sign = delta > 0 ? '+' : '';
  return (
    <div className={'cds-tile' + (onClick ? ' cds-tile--clickable' : '')} onClick={onClick}>
      <div className="cds-tile__label flex items-center gap-2 justify-between">
        <span>{label}</span>
        {live && <span className="cds-tag cds-tag--live">LIVE</span>}
      </div>
      <div className="cds-tile__value flex items-end">
        <span>{value}</span>
        {delta != null && (
          <span className={'cds-tile__delta ' + cls}>
            <CIcon name={delta > 0 ? 'arrowU' : 'arrowD'} size={12}/>
            {sign}{delta}{deltaType === 'pct' ? '%' : ''}
          </span>
        )}
      </div>
      {spark && <Sparkline data={spark} color={live ? 'var(--red-60)' : (good && delta > 0 ? 'var(--green-50)' : 'var(--text-02)')} live={live}/>}
      <div className="cds-tile__caption">{caption}</div>
    </div>
  );
}

function Sparkline({ data, color = 'var(--blue-60)', live, height = 28 }) {
  const w = 240, h = height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / range) * (h - 4) - 2]);
  const d = 'M' + pts.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join(' L ');
  const fill = d + ` L ${w},${h} L 0,${h} Z`;
  const id = 'sg-' + Math.random().toString(36).slice(2, 7);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ marginTop: 10, display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.16"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${id})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="1.25" strokeLinecap="square"/>
      {live && (
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color}>
          <animate attributeName="r" values="2.5;5;2.5" dur="1.6s" repeatCount="indefinite"/>
        </circle>
      )}
    </svg>
  );
}

function CTag({ children, tone = 'gray' }) {
  return <span className={'cds-tag cds-tag--' + tone}>{children}</span>;
}

function CButton({ children, variant = 'primary', size, leftIcon, rightIcon, onClick, disabled }) {
  const cls = 'cds-btn' + (variant !== 'primary' ? ' cds-btn--' + variant : '') + (size ? ' cds-btn--' + size : '') + (!children ? ' cds-btn--icon-only' : '');
  return (
    <button className={cls} onClick={onClick} disabled={disabled}>
      {leftIcon && <CIcon name={leftIcon} size={16}/>}
      {children}
      {rightIcon && <CIcon name={rightIcon} size={16}/>}
    </button>
  );
}

window.CTile = CTile;
window.Sparkline = Sparkline;
window.CTag = CTag;
window.CButton = CButton;
