// IPCK House — Carbon Dashboard with tab-based navigation (no long scrolling)

const TABS = [
  { id: 'overview', label: 'Overview',     count: null  },
  { id: 'live',     label: 'Live now',     count: 'LIVE', live: true },
  { id: 'care',     label: 'Pastoral care', count: 6 },
  { id: 'giving',   label: 'Giving today', count: 14 },
  { id: 'people',   label: 'People & engagement', count: null },
  { id: 'content',  label: 'Content & schedule',  count: null },
  { id: 'activity', label: 'Activity',      count: null },
];

function Dashboard() {
  const [tab, setTab] = React.useState('overview');
  const Panel = {
    overview: OverviewPanel,
    live:     LivePanel,
    care:     CarePanel,
    giving:   GivingPanel,
    people:   PeoplePanel,
    content:  ContentPanel,
    activity: ActivityPanel,
  }[tab] || OverviewPanel;

  return (
    <>
      {/* Page header */}
      <div className="cds-page-head">
        <div className="cds-breadcrumb">
          <a href="#">IPCK House</a>
          <span className="sep">/</span>
          <a href="#">Admin</a>
          <span className="sep">/</span>
          <span>Dashboard</span>
        </div>
        <div className="cds-page-title-row">
          <div>
            <h1 className="cds-page-title">Dashboard</h1>
            <p className="cds-page-subtitle">
              {DATA.today.dateLong} · {DATA.today.timeShort} · Service is live now — {DATA.service.viewersLive} watching.
            </p>
          </div>
          <div className="cds-page-actions">
            <CButton variant="tertiary" size="md" leftIcon="download">Weekly report</CButton>
            <CButton variant="primary"  size="md" rightIcon="add">New broadcast</CButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="cds-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={'cds-tab' + (tab === t.id ? ' is-active' : '')}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.count != null && (
                t.live
                  ? <span className="cds-tag cds-tag--live">{t.count}</span>
                  : <span className="cds-tab__count">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panel */}
      <div className="cds-tab-panel">
        <Panel/>
      </div>
    </>
  );
}

/* ============================================================
   TAB 1 — OVERVIEW
   5 KPI tiles + 2-column main grid
   ============================================================ */

function OverviewPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI strip — 5 tiles in a strict grid */}
      <div className="cds-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {DATA.kpis.map(k => (
          <CTile key={k.id} {...k}/>
        ))}
      </div>

      {/* 2-column main */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--ui-03)', border: '1px solid var(--ui-03)' }}>
        <NeedsYouPanel/>
        <TodaySnapshotPanel/>
      </div>
    </div>
  );
}

function NeedsYouPanel() {
  const queue = [
    { kind: 'prayer',  count: 4, label: 'Private prayer requests awaiting your reply', age: 'oldest 5h ago', tone: 'red',    icon: 'lock' },
    { kind: 'mod',     count: 2, label: 'Public prayers awaiting moderation',         age: 'oldest 23min',  tone: 'yellow', icon: 'prayer' },
    { kind: 'devo',    count: 1, label: 'Devotional draft to publish for Thu 28 May', age: '',              tone: 'blue',   icon: 'devo' },
    { kind: 'gift',    count: 1, label: 'Failed gift — $100 from Claude L.',           age: '2h ago',       tone: 'red',    icon: 'give' },
    { kind: 'sermon',  count: 1, label: 'Sermon ready to publish — “Walking with the broken”', age: '', tone: 'green', icon: 'sermons' },
  ];
  return (
    <div style={{ background: 'var(--ui-background)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--ui-03)' }}>
        <h3 style={{ margin: 0, font: '600 1rem/1.375rem var(--font-sans)' }}>What needs you</h3>
        <span className="t-caption-01 text-05">{queue.length} actions · sorted by priority</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {queue.map((q, i) => (
          <li key={i} style={{
            display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 12,
            padding: '14px 16px', alignItems: 'center',
            borderBottom: i < queue.length - 1 ? '1px solid var(--ui-03)' : 'none',
            cursor: 'pointer', transition: 'background 110ms',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-row)'}
          onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            <div style={{
              width: 32, height: 32, background: `var(--${q.tone === 'red' ? 'red-light' : q.tone === 'yellow' ? 'yellow-light' : q.tone === 'green' ? 'green-light' : 'blue-20'})`,
              color: `var(--${q.tone === 'red' ? 'red-70' : q.tone === 'yellow' ? 'yellow-30' : q.tone === 'green' ? 'green-60' : 'blue-70'})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CIcon name={q.icon} size={18}/>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="t-heading-01">
                {q.count > 1 ? <span style={{ color: 'var(--text-02)', marginRight: 6 }}>{q.count}</span> : null}
                {q.label}
              </div>
              {q.age && <div className="t-caption-01 text-05" style={{ marginTop: 2 }}>{q.age}</div>}
            </div>
            <CIcon name="chevron" size={16} color="var(--text-02)"/>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TodaySnapshotPanel() {
  const s = DATA.service;
  return (
    <div style={{ background: 'var(--ui-background)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--ui-03)' }}>
        <h3 style={{ margin: 0, font: '600 1rem/1.375rem var(--font-sans)' }}>Today at IPCK</h3>
        <span className="t-caption-01 text-05">{DATA.today.timeShort}</span>
      </div>

      {/* Live now block */}
      <div style={{ padding: 16, borderBottom: '1px solid var(--ui-03)', background: 'var(--gray-100)', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="cds-tag cds-tag--live">ON AIR</span>
          <span className="t-caption-01" style={{ color: 'var(--gray-30)' }}>Sunday service · {s.startedMin} min in</span>
        </div>
        <div className="t-heading-03" style={{ color: '#fff', marginBottom: 2 }}>{s.title}</div>
        <div className="t-caption-01" style={{ color: 'var(--gray-30)', marginBottom: 12 }}>{s.speaker} · {s.series}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Stat lbl="Live" val={s.viewersLive} accent/>
          <Stat lbl="Peak" val={s.viewersPeak}/>
          <Stat lbl="In-person" val={s.inPerson}/>
          <Stat lbl="Stream" val={s.quality}/>
        </div>
      </div>

      {/* Devotional today */}
      <div style={{ padding: 16, borderBottom: '1px solid var(--ui-03)' }}>
        <div className="t-caption-01 text-05 uppercase" style={{ marginBottom: 6, letterSpacing: 1.4 }}>Today's devotional · published 06:00</div>
        <div className="t-heading-03" style={{ marginBottom: 6 }}>When the wait feels long</div>
        <div className="t-body-short-01 text-02">Romans 8:28 — by Pastor Mukendi · <span className="text-success" style={{ fontWeight: 600 }}>412</span> read · 71% completion</div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--ui-03)' }}>
        <QuickAction icon="send"  label="Push verse"   sub="To live viewers"/>
        <QuickAction icon="prayer" label="Open prayer queue" sub="4 private · waiting"/>
        <QuickAction icon="add"   label="New devotional" sub="Schedule for Friday"/>
      </div>
    </div>
  );
}

function Stat({ lbl, val, accent }) {
  return (
    <div>
      <div style={{ font: '600 1.5rem/2rem var(--font-sans)', color: accent ? 'var(--yellow-30)' : '#fff' }}>{val}</div>
      <div className="t-caption-01 uppercase" style={{ color: 'var(--gray-40)', letterSpacing: 1.2, marginTop: 2 }}>{lbl}</div>
    </div>
  );
}

function QuickAction({ icon, label, sub }) {
  return (
    <button style={{
      display: 'flex', flexDirection: 'column', gap: 4, padding: 14,
      background: 'var(--ui-background)', border: 'none', cursor: 'pointer',
      textAlign: 'left', transition: 'background 110ms',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--ui-01)'}
    onMouseLeave={e => e.currentTarget.style.background = 'var(--ui-background)'}
    >
      <CIcon name={icon} size={20} color="var(--blue-60)"/>
      <div className="t-heading-01" style={{ marginTop: 4 }}>{label}</div>
      <div className="t-caption-01 text-05">{sub}</div>
    </button>
  );
}

/* ============================================================
   TAB 2 — LIVE NOW
   Stream preview + scenes + viewers geo + push actions + chat preview
   ============================================================ */

function LivePanel() {
  const s = DATA.service;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 1, background: 'var(--ui-03)', border: '1px solid var(--ui-03)' }}>
      {/* LEFT */}
      <div style={{ background: 'var(--ui-background)', display: 'flex', flexDirection: 'column' }}>
        {/* Stream preview */}
        <div style={{ position: 'relative', aspectRatio: '16 / 9', background: 'var(--gray-100)' }}>
          <svg width="100%" height="100%" viewBox="0 0 800 450" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} preserveAspectRatio="xMidYMid slice">
            <rect width="800" height="450" fill="var(--gray-100)"/>
            <circle cx="280" cy="280" r="170" fill="var(--yellow-30)" opacity="0.35"/>
            <circle cx="540" cy="180" r="120" fill="var(--blue-60)" opacity="0.45"/>
          </svg>
          <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
            <span className="cds-tag cds-tag--live" style={{ height: 22 }}>ON AIR</span>
            <span className="cds-tag" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>{s.quality} · {s.bitrate}</span>
          </div>
          <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', font: '400 12px/1 var(--font-mono)' }}>
            {s.viewersLive.toLocaleString()} watching · 00:27:43
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#fff' }}>
            <div className="t-heading-04" style={{ color: '#fff' }}>{s.title}</div>
            <div className="t-body-short-01" style={{ color: 'var(--gray-30)', marginTop: 4 }}>{s.speaker}</div>
          </div>
          {/* Bottom controls */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button style={iconBtn}><CIcon name="mic" size={18} color="#fff"/></button>
            <button style={iconBtn}><CIcon name="video" size={18} color="#fff"/></button>
            <button style={{...iconBtn, background: 'var(--red-60)' }}><CIcon name="pause" size={18} color="#fff"/></button>
          </div>
        </div>

        {/* Scenes */}
        <div style={{ padding: 12, borderTop: '1px solid var(--ui-03)' }}>
          <div className="t-caption-01 text-05 uppercase" style={{ letterSpacing: 1.4, marginBottom: 8 }}>Scenes</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {s.scenes.map(name => {
              const on = name === s.sceneActive;
              return (
                <button key={name} className={'cds-btn cds-btn--sm ' + (on ? '' : 'cds-btn--tertiary')}
                  style={{ background: on ? 'var(--red-60)' : undefined, borderColor: on ? 'var(--red-60)' : undefined, color: on ? '#fff' : undefined }}>
                  {on && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'cds-pulse 1.6s ease-in-out infinite' }}/>}
                  {name}{on ? ' · LIVE' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Push to viewers */}
        <div style={{ padding: 16, borderTop: '1px solid var(--ui-03)' }}>
          <div className="t-caption-01 text-05 uppercase" style={{ letterSpacing: 1.4, marginBottom: 8 }}>Push to viewers · in-app</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--ui-03)' }}>
            <QuickAction icon="send"   label="Show verse"     sub="Ephesians 2:8-9"/>
            <QuickAction icon="give"   label="Open Give"      sub="Deep-link in-app"/>
            <QuickAction icon="prayer" label="Invite to pray" sub="Live prayer prompt"/>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ background: 'var(--ui-background)', display: 'flex', flexDirection: 'column' }}>
        {/* Viewers chart */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--ui-03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="t-heading-02">Viewers this service</div>
            <div className="t-caption-01 text-05">peak {s.viewersPeak} · avg 487</div>
          </div>
          <Sparkline data={[180,220,280,360,420,540,612,684,660,612,600,588,620,640,612]} color="var(--blue-60)" live height={44}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span className="t-caption-01 text-05 t-mono">09:30 start</span>
            <span className="t-caption-01 text-05 t-mono">09:50</span>
            <span className="t-caption-01 text-05 t-mono">10:10</span>
            <span className="t-caption-01 text-05 t-mono">now</span>
          </div>
        </div>

        {/* Geo */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--ui-03)' }}>
          <div className="t-heading-02" style={{ marginBottom: 12 }}>Watching from</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {s.geo.map(g => (
              <div key={g.c}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="t-body-short-01">{g.c}</span>
                  <span className="t-mono t-caption-01"><strong>{g.n}</strong> · {g.pct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--ui-01)' }}>
                  <div style={{ height: '100%', width: g.pct + '%', background: 'var(--blue-60)' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat snapshot */}
        <div style={{ padding: 16, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div className="t-heading-02">Live chat</div>
            <span className="cds-tag cds-tag--blue">42 unread</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { who: 'Grace M.', t: 'Praying for everyone watching from Paris 🙏', ago: '1m' },
              { who: 'Joseph K.', t: 'Powerful word this morning, pastor.',         ago: '3m' },
              { who: 'Nadine B.', t: 'Can someone send the verse reference?',       ago: '5m' },
              { who: 'Pierre T.', t: 'Ephesians 2:8-9',                              ago: '5m' },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span className="cds-avatar" style={{ background: 'var(--gray-80)', width: 24, height: 24, fontSize: 10 }}>{m.who[0]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                    <span className="t-heading-01">{m.who}</span>
                    <span className="t-caption-01 text-05 t-mono">{m.ago}</span>
                  </div>
                  <div className="t-body-short-01 text-02">{m.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const iconBtn = {
  width: 36, height: 36, background: 'rgba(0,0,0,0.6)', color: '#fff',
  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

window.Dashboard = Dashboard;
window.OverviewPanel = OverviewPanel;
window.LivePanel = LivePanel;
