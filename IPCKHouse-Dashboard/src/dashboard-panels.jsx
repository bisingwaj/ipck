// IPCK House — Remaining tab panels: Care · Giving · People · Content · Activity

/* ============================================================
   TAB 3 — PASTORAL CARE
   Master/detail-ish: Prayer queue (left) + Appointments today (right)
   Confidentiality banner up top.
   ============================================================ */

function CarePanel() {
  const pending = DATA.prayers.filter(p => p.status === 'pending');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Confidentiality banner */}
      <div className="cds-notification cds-notification--warn">
        <CIcon name="lock" size={20} color="var(--yellow-30)"/>
        <div style={{ flex: 1 }}>
          <div className="cds-notification__title">Pastoral confidentiality is active</div>
          <div className="cds-notification__body">
            Private prayer requests are encrypted at rest and excluded from analytics, exports and AI features.
            Only Pastor Mukendi and Pastor Esther can decrypt them. Every access is logged.
            <a href="#" style={{ color: 'var(--link-01)', marginLeft: 8, fontWeight: 600 }}>Audit log →</a>
          </div>
        </div>
        <button className="cds-btn cds-btn--ghost cds-btn--sm" style={{ minWidth: 0 }}>
          <CIcon name="close" size={16}/>
        </button>
      </div>

      {/* Master / detail layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 1, background: 'var(--ui-03)', border: '1px solid var(--ui-03)', minHeight: 540 }}>
        {/* LEFT — Prayer queue */}
        <div style={{ background: 'var(--ui-background)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--ui-03)' }}>
            <div>
              <h3 style={{ margin: 0, font: '600 1rem/1.375rem var(--font-sans)' }}>Prayer queue</h3>
              <div className="t-caption-01 text-05" style={{ marginTop: 2 }}>
                {pending.length} pending · {pending.filter(p => p.vis === 'private').length} private to pastor · {pending.filter(p => p.vis === 'public').length} public awaiting moderation
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <CButton variant="ghost" size="sm" leftIcon="filter">Filter</CButton>
              <CButton variant="tertiary" size="sm">Open wall</CButton>
            </div>
          </div>

          <table className="cds-data-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th style={{ width: 110 }}>Submitted</th>
                <th>Member</th>
                <th>Visibility</th>
                <th>Excerpt</th>
                <th style={{ width: 100 }} className="num">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(p => (
                <tr key={p.id} style={{ cursor: 'pointer' }}>
                  <td><span className="cds-status-dot cds-status-dot--err"/></td>
                  <td className="t-mono">{p.ago}</td>
                  <td>{p.who}</td>
                  <td>
                    {p.vis === 'private' && <CTag tone="blue"><CIcon name="lock" size={12}/> Private</CTag>}
                    {p.vis === 'anon'    && <CTag tone="gray">Anonymous</CTag>}
                    {p.vis === 'public'  && <CTag tone="green"><CIcon name="globe" size={12}/> Public</CTag>}
                  </td>
                  <td className="truncate" style={{ maxWidth: 280, color: 'var(--text-02)' }}>{p.text}</td>
                  <td className="num">
                    <div style={{ display: 'inline-flex', gap: 4 }}>
                      <button className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only" title="Reply"><CIcon name="mail" size={16}/></button>
                      <button className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only" title="Mark prayed"><CIcon name="check" size={16}/></button>
                      <button className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only" title="More"><CIcon name="overflow" size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RIGHT — Appointments today */}
        <div style={{ background: 'var(--ui-background)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--ui-03)' }}>
            <div>
              <h3 style={{ margin: 0, font: '600 1rem/1.375rem var(--font-sans)' }}>Today · pastoral appointments</h3>
              <div className="t-caption-01 text-05" style={{ marginTop: 2 }}>{DATA.appointments.length} scheduled · {DATA.appointments.filter(a => a.status === 'tentative').length} tentative</div>
            </div>
            <CButton variant="ghost" size="sm" leftIcon="add">Block time</CButton>
          </div>

          <ol style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
            {DATA.appointments.map((a, i) => (
              <li key={i} style={{
                display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 12,
                padding: '14px 16px',
                borderBottom: i < DATA.appointments.length - 1 ? '1px solid var(--ui-03)' : 'none',
                alignItems: 'flex-start',
              }}>
                <div>
                  <div className="t-mono" style={{ font: '600 14px/18px var(--font-mono)' }}>{a.time}</div>
                  <div className="t-caption-01 text-05">{a.with}</div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="t-heading-01">{a.who}</div>
                  <div className="t-body-short-01 text-02" style={{ marginTop: 2 }}>{a.topic}</div>
                  <div className="t-caption-01 text-05" style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CIcon name="pin" size={12}/> {a.loc}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {a.status === 'tentative'
                    ? <CTag tone="yellow">Tentative</CTag>
                    : <CTag tone="green">Confirmed</CTag>
                  }
                  <button className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only" title="More"><CIcon name="overflow" size={16}/></button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TAB 4 — GIVING TODAY
   ============================================================ */

function GivingPanel() {
  const total = DATA.gifts.reduce((s, g) => s + g.amount, 0);
  const max = Math.max(...DATA.gifts.map(g => g.amount));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top tile strip */}
      <div className="cds-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <CTile label="Received today" value={'$' + total} delta={+8.3} deltaType="pct" good caption={`${DATA.gifts.length} gifts · live ledger`} spark={[20,30,45,80,120,180,240,310]}/>
        <CTile label="Week-to-date"   value="$6,420"  delta={+12.4} deltaType="pct" good caption="38 gifts" spark={[400,600,800,1000,1400,2200,3400]}/>
        <CTile label="Month-to-date"  value="$18,420" delta={+12.4} deltaType="pct" good caption="124 gifts · target $24k" spark={[1000,2400,3800,5400,7200,9100,11200,13800,16100,18420]}/>
        <CTile label="YTD"            value="$168,400" delta={+4.1} deltaType="pct" good caption="70% of yearly target" spark={[10,20,32,44,57,72,89,108,128,148,168]}/>
      </div>

      {/* Two-column: breakdown + table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 1, background: 'var(--ui-03)', border: '1px solid var(--ui-03)' }}>
        {/* Breakdowns */}
        <div style={{ background: 'var(--ui-background)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui-03)' }}>
            <h3 style={{ margin: 0, font: '600 1rem/1.375rem var(--font-sans)' }}>Today's split</h3>
            <div className="t-caption-01 text-05" style={{ marginTop: 2 }}>By fund and channel</div>
          </div>
          <div style={{ padding: 16 }}>
            <div className="t-caption-01 text-05 uppercase" style={{ letterSpacing: 1.4, marginBottom: 8 }}>By fund</div>
            <div style={{ display: 'flex', height: 8, marginBottom: 12 }}>
              <div style={{ flex: 58, background: 'var(--blue-60)' }} title="General · 58%"/>
              <div style={{ flex: 21, background: 'var(--yellow-30)' }} title="Building · 21%"/>
              <div style={{ flex: 14, background: 'var(--green-50)' }} title="Missions · 14%"/>
              <div style={{ flex:  7, background: 'var(--purple-60)' }} title="Benevolence · 7%"/>
            </div>
            <Legend rows={[
              { color: 'var(--blue-60)',   l: 'General',     v: '58% · $1,648' },
              { color: 'var(--yellow-30)', l: 'Building',    v: '21% · $597' },
              { color: 'var(--green-50)',  l: 'Missions',    v: '14% · $397' },
              { color: 'var(--purple-60)', l: 'Benevolence', v:  '7% · $198' },
            ]}/>

            <hr style={{ border: 0, borderTop: '1px solid var(--ui-03)', margin: '16px 0' }}/>

            <div className="t-caption-01 text-05 uppercase" style={{ letterSpacing: 1.4, marginBottom: 8 }}>By channel</div>
            <div style={{ display: 'flex', height: 8, marginBottom: 12 }}>
              {DATA.channels.map(c => <div key={c.name} style={{ flex: c.pct, background: c.color }} title={`${c.name} · ${c.pct}%`}/>)}
            </div>
            <Legend rows={DATA.channels.map(c => ({ color: c.color, l: c.name, v: `${c.pct}% · $${c.amt}` }))}/>

            <div style={{ marginTop: 16, padding: 12, background: 'var(--ui-01)' }}>
              <div className="t-caption-01" style={{ color: 'var(--text-01)', fontWeight: 600, marginBottom: 4 }}>83% of gifts via mobile money today</div>
              <div className="t-caption-01 text-05">M-Pesa settles 06:00 tomorrow · Airtel 14:00 · Orange 16:00</div>
            </div>
          </div>
        </div>

        {/* Recent gifts table */}
        <div style={{ background: 'var(--ui-background)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--ui-03)' }}>
            <div>
              <h3 style={{ margin: 0, font: '600 1rem/1.375rem var(--font-sans)' }}>Recent gifts · live</h3>
              <div className="t-caption-01 text-05" style={{ marginTop: 2 }}>Reconciled with providers</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <CButton variant="ghost" size="sm" leftIcon="filter">Filter</CButton>
              <CButton variant="ghost" size="sm" leftIcon="download">Export</CButton>
            </div>
          </div>
          <table className="cds-data-table cds-data-table--compact">
            <thead>
              <tr>
                <th>Reference</th>
                <th>From</th>
                <th>Fund</th>
                <th>Channel</th>
                <th className="num">Amount</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {DATA.gifts.map(g => (
                <tr key={g.ref}>
                  <td className="t-mono t-caption-01 text-02">{g.ref}</td>
                  <td>{g.who}</td>
                  <td className="text-02">{g.fund}</td>
                  <td><CTag tone="gray">{g.ch}</CTag></td>
                  <td className="num">${g.amount}</td>
                  <td>
                    {g.status === 'received' && <CTag tone="green"><CIcon name="check" size={11}/> received</CTag>}
                    {g.status === 'pending'  && <CTag tone="yellow">pending</CTag>}
                    {g.status === 'failed'   && <CTag tone="red">failed</CTag>}
                  </td>
                  <td className="text-05 t-caption-01">{g.ago}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Legend({ rows }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map(r => (
        <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
          <span style={{ width: 8, height: 8, background: r.color, flexShrink: 0 }}/>
          <span style={{ flex: 1 }}>{r.l}</span>
          <span className="t-mono text-05">{r.v}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   TAB 5 — PEOPLE & ENGAGEMENT
   ============================================================ */

function PeoplePanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="cds-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <CTile label="Members" value="1,284" delta={+3.2} deltaType="pct" good caption="+41 this month"/>
        <CTile label="Leaders & pastors" value="42" delta={+2} deltaType="abs" good caption="3 new this quarter"/>
        <CTile label="Visitors awaiting follow-up" value="86" delta={-12} deltaType="abs" good caption="↓ good — we are reaching them"/>
        <CTile label="Inactive 30+ days" value="124" delta={+8} deltaType="abs" caption="Run a re-engagement campaign"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'var(--ui-03)', border: '1px solid var(--ui-03)' }}>
        {/* New members */}
        <div style={{ background: 'var(--ui-background)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui-03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, font: '600 1rem/1.375rem var(--font-sans)' }}>New members</h3>
            <CButton variant="ghost" size="sm" rightIcon="chevron">See all</CButton>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {DATA.newMembers.map((m, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: i < DATA.newMembers.length - 1 ? '1px solid var(--ui-03)' : 'none' }}>
                <span className="cds-avatar" style={{ background: ['var(--blue-60)','var(--purple-60)','var(--green-50)','var(--magenta-60)','var(--teal-50)'][i % 5] }}>{m.name.split(' ').map(p => p[0]).join('').slice(0,2)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-heading-01">{m.name}</div>
                  <div className="t-caption-01 text-05">Joined {m.when} · {m.source}</div>
                </div>
                <button className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"><CIcon name="mail" size={16}/></button>
              </li>
            ))}
          </ul>
        </div>

        {/* Engagement signals */}
        <div style={{ background: 'var(--ui-background)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui-03)' }}>
            <h3 style={{ margin: 0, font: '600 1rem/1.375rem var(--font-sans)' }}>Engagement signals</h3>
            <div className="t-caption-01 text-05" style={{ marginTop: 2 }}>This week vs. target</div>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {DATA.engagement.map(e => (
              <div key={e.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="t-body-short-01">{e.label}</span>
                  <span className="t-mono t-heading-01">
                    {e.pct}% <span className="text-05" style={{ fontWeight: 400 }}>/ {e.target}%</span>
                  </span>
                </div>
                <div style={{ position: 'relative', height: 6, background: 'var(--ui-01)' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: e.pct + '%', background: e.pct >= e.target ? 'var(--green-50)' : 'var(--blue-60)' }}/>
                  <div style={{ position: 'absolute', left: e.target + '%', top: -2, height: 10, width: 1, background: 'var(--gray-100)' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Groups snapshot */}
        <div style={{ background: 'var(--ui-background)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui-03)' }}>
            <h3 style={{ margin: 0, font: '600 1rem/1.375rem var(--font-sans)' }}>Groups · most active</h3>
            <div className="t-caption-01 text-05" style={{ marginTop: 2 }}>By messages this week</div>
          </div>
          <table className="cds-data-table cds-data-table--compact">
            <thead><tr><th>Group</th><th>Leader</th><th className="num">Members</th><th className="num">Msgs/wk</th></tr></thead>
            <tbody>
              {[
                ["Women's Bible Study", 'P. Esther', 24, 412],
                ['Young Adults',        'Pierre T.', 41, 320],
                ['Worship team',        'Grace M.',  12, 218],
                ['Couples',             'P. Mukendi',32, 187],
                ['Ushers',              'Marie-Anne',22,  98],
              ].map((r, i) => (
                <tr key={i}>
                  <td>{r[0]}</td><td className="text-02">{r[1]}</td>
                  <td className="num">{r[2]}</td><td className="num">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TAB 6 — CONTENT & SCHEDULE
   ============================================================ */

function ContentPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--ui-03)', border: '1px solid var(--ui-03)' }}>
        {/* Today devotional */}
        <div style={{ background: 'var(--ui-background)', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <CTag tone="blue">DEVOTIONAL · LIVE</CTag>
            <CButton variant="ghost" size="sm" leftIcon="edit">Edit</CButton>
          </div>
          <div className="t-heading-04" style={{ marginBottom: 8 }}>When the wait feels long</div>
          <div className="t-caption-01 text-05 t-mono" style={{ marginBottom: 16 }}>ROMANS 8:28 · NIV · BY PASTOR MUKENDI</div>
          <div className="t-body-long-02" style={{ color: 'var(--text-02)', marginBottom: 16, borderLeft: '2px solid var(--blue-60)', paddingLeft: 16 }}>
            "And we know that in all things God works for the good of those who love him, who have been called according to his purpose."
          </div>
          <div className="cds-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <CTile label="Read" value="412" caption="46% of subscribers"/>
            <CTile label="Completion" value="71%" delta={-3} deltaType="pct" caption="vs avg 74%"/>
            <CTile label="Saved" value="38"  caption="Bookmarked"/>
          </div>
        </div>

        {/* Latest sermon */}
        <div style={{ background: 'var(--ui-background)', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <CTag tone="red">SERMON · LIVE NOW</CTag>
            <CButton variant="ghost" size="sm" rightIcon="chevron">Open</CButton>
          </div>
          <div className="t-heading-04" style={{ marginBottom: 8 }}>Grace, not earned</div>
          <div className="t-caption-01 text-05" style={{ marginBottom: 16 }}>ANCHORED · PART 3 OF 5 · PASTOR MUKENDI · 38 MIN</div>

          {/* Mini stream preview */}
          <div style={{ aspectRatio: '16/9', background: 'var(--gray-100)', position: 'relative', marginBottom: 16 }}>
            <svg width="100%" height="100%" viewBox="0 0 320 180" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} preserveAspectRatio="xMidYMid slice">
              <circle cx="100" cy="120" r="60" fill="var(--yellow-30)" opacity="0.5"/>
              <circle cx="220" cy="60" r="40" fill="var(--blue-60)" opacity="0.6"/>
            </svg>
            <div style={{ position: 'absolute', top: 8, left: 8 }}>
              <span className="cds-tag cds-tag--live">ON AIR · 612</span>
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CIcon name="play" size={24} color="var(--gray-100)"/>
              </div>
            </div>
          </div>

          <div className="cds-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <CTile label="Watching" value="612" delta={+18} deltaType="abs" good caption="Peak 684"/>
            <CTile label="Avg watch" value="22m" caption="of 38 min"/>
            <CTile label="On-demand later" value="—" caption="Recording will publish auto"/>
          </div>
        </div>
      </div>

      {/* Schedule table */}
      <div style={{ background: 'var(--ui-background)', border: '1px solid var(--ui-03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--ui-03)' }}>
          <div>
            <h3 style={{ margin: 0, font: '600 1rem/1.375rem var(--font-sans)' }}>Upcoming schedule</h3>
            <div className="t-caption-01 text-05" style={{ marginTop: 2 }}>Next 7 days · 1 slot needs writing</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <CButton variant="ghost" size="sm" leftIcon="filter">Filter</CButton>
            <CButton variant="primary" size="sm" leftIcon="add">New devotional</CButton>
          </div>
        </div>
        <table className="cds-data-table cds-data-table--compact">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th style={{ width: 110 }}>Type</th>
              <th>Title</th>
              <th>When</th>
              <th>Author</th>
              <th>Status</th>
              <th className="num" style={{ width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {DATA.upcomingContent.map((r, i) => (
              <tr key={i} style={{ opacity: r.status === 'empty' ? 0.6 : 1 }}>
                <td>
                  <span className={'cds-status-dot ' + (
                    r.status === 'scheduled' ? 'cds-status-dot--ok'
                    : r.status === 'draft' ? 'cds-status-dot--warn'
                    : 'cds-status-dot--err'
                  )}/>
                </td>
                <td><CTag tone={r.type === 'Sermon' ? 'magenta' : 'blue'}>{r.type}</CTag></td>
                <td>{r.title === '(empty)' ? <span className="text-error">— Needs writing</span> : r.title}</td>
                <td className="text-02 t-mono">{r.when}</td>
                <td className="text-02">{r.author}</td>
                <td>
                  {r.status === 'scheduled' && <CTag tone="green">Scheduled</CTag>}
                  {r.status === 'draft'     && <CTag tone="yellow">Draft</CTag>}
                  {r.status === 'empty'     && <CTag tone="red">Empty</CTag>}
                </td>
                <td className="num">
                  {r.status === 'empty'
                    ? <CButton variant="tertiary" size="sm" leftIcon="add">Write</CButton>
                    : <CButton variant="ghost" size="sm" leftIcon="edit">Edit</CButton>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   TAB 7 — ACTIVITY
   ============================================================ */

function ActivityPanel() {
  const colorByKind = {
    give: 'var(--green-50)', prayer: 'var(--purple-60)', appts: 'var(--yellow-30)',
    members: 'var(--blue-60)', events: 'var(--teal-50)', sermons: 'var(--red-60)',
    groups: 'var(--gray-80)', broadcast: 'var(--magenta-60)', live: 'var(--red-60)',
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 1, background: 'var(--ui-03)', border: '1px solid var(--ui-03)' }}>
      <div style={{ background: 'var(--ui-background)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--ui-03)' }}>
          <div>
            <h3 style={{ margin: 0, font: '600 1rem/1.375rem var(--font-sans)' }}>Activity</h3>
            <div className="t-caption-01 text-05" style={{ marginTop: 2 }}>Real-time · all events</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <CButton variant="ghost" size="sm" leftIcon="filter">Filter</CButton>
            <CButton variant="ghost" size="sm" leftIcon="download">Export</CButton>
          </div>
        </div>
        <table className="cds-data-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th style={{ width: 110 }}>Kind</th>
              <th>Who</th>
              <th>What</th>
              <th className="num" style={{ width: 110 }}>When</th>
            </tr>
          </thead>
          <tbody>
            {DATA.activity.map((a, i) => (
              <tr key={i}>
                <td><span style={{ display: 'inline-block', width: 8, height: 8, background: colorByKind[a.kind] || 'var(--gray-60)' }}/></td>
                <td><span className="t-caption-01 uppercase t-mono" style={{ letterSpacing: 1, color: 'var(--text-02)' }}>{a.kind}</span></td>
                <td className="t-heading-01">{a.who}</td>
                <td className="text-02">{a.what}</td>
                <td className="num text-05 t-caption-01">{a.ago}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right summary */}
      <div style={{ background: 'var(--ui-background)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui-03)' }}>
          <h3 style={{ margin: 0, font: '600 1rem/1.375rem var(--font-sans)' }}>By kind · 24h</h3>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {[
            { k: 'Giving',     n: 38, c: 'var(--green-50)' },
            { k: 'Prayers',    n: 14, c: 'var(--purple-60)' },
            { k: 'New members', n: 5, c: 'var(--blue-60)' },
            { k: 'Appointments', n: 8, c: 'var(--yellow-30)' },
            { k: 'Sermons published', n: 1, c: 'var(--red-60)' },
            { k: 'Group activity', n: 124, c: 'var(--gray-80)' },
            { k: 'Broadcasts',   n: 2, c: 'var(--magenta-60)' },
          ].map((r, i, arr) => (
            <li key={r.k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--ui-03)' : 'none' }}>
              <span style={{ width: 8, height: 8, background: r.c }}/>
              <span className="t-body-short-01" style={{ flex: 1 }}>{r.k}</span>
              <span className="t-heading-02 t-mono">{r.n}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

Object.assign(window, { CarePanel, GivingPanel, PeoplePanel, ContentPanel, ActivityPanel });
