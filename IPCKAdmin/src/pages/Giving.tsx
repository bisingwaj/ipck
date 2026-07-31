import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Money } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Tile, Panel, Empty, StatusBadge, Meter } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, DetailSection, DetailLead, Field } from '../components/DetailPanel';
import { useAction } from '../api/useAction';
import { useAuth } from '../auth/AuthContext';
import { t, dateLocale } from '../i18n';

interface Summary {
  funds: { id: string; name: string; budget: number; ytd: number; accent?: string }[];
  channels: { name: string; amt: number; count: number }[];
  monthToDate: number;
}

// Canaux de paiement → libellé bilingue (le backend stocke le code brut).
const CHANNEL_KEYS = new Set(['wallet', 'momo', 'mpesa', 'airtel', 'orange', 'afrimoney', 'card', 'cash']);
const channelLabel = (c: string) => (CHANNEL_KEYS.has(c) ? t(`channel.${c}`) : c);

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

/** Date courte localisée ("31 mai 2026" / "May 31, 2026"). */
const dateShort = (iso: string) =>
  new Date(iso).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' });

interface Donation {
  id: string;
  ref: string;
  amount: number;
  fundId: string;
  method: string;
  status: string;
  anonymous: boolean;
  createdAt: string;
}

const donStatusDesc = (s: string) =>
  ['received', 'pending', 'failed'].includes(s) ? t(`giving.donStatus.${s}`) : '';

export default function Giving() {
  const { can } = useAuth();
  const mayExport = can('giving.export'); // miroir de @Roles('admin') côté backend
  const [detail, setDetail] = useState<Donation | null>(null);

  const summary = useQuery({
    queryKey: ['giving-summary'],
    queryFn: async () => (await api.get('/giving/admin/summary')).data as Summary,
  });
  const donations = useQuery({
    queryKey: ['giving-donations'],
    queryFn: async () =>
      (await api.get('/giving/admin/donations', { params: { pageSize: 50 } })).data.data as Donation[],
  });

  const exportCsv = useAction<void, { data: { csv: string } }>({
    mutationFn: () => api.get('/giving/admin/export'),
    confirm: () => ({
      title: t('giving.confirmExportTitle'),
      message: t('giving.confirmExportMsg'),
      confirmLabel: t('giving.confirmExportLabel'),
    }),
    successTitle: t('giving.exportGenerated'),
    errorTitle: t('giving.exportFailed'),
    onDone: (res) => {
      const csv = res?.data?.csv ?? '';
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ipck-dons-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const fundName = (id: string, funds: Summary['funds']) =>
    funds.find((f) => f.id === id)?.name ?? id;

  return (
    <>
      <PageHead
        title={t('giving.title')}
        subtitle={t('giving.subtitle')}
        actions={
          mayExport ? (
            <button
              className="cds-btn cds-btn--md"
              onClick={() => exportCsv.run()}
              disabled={exportCsv.isPending}
            >
              {exportCsv.isPending ? t('giving.exporting') : t('giving.export')}
              <Download size={16} />
            </button>
          ) : undefined
        }
      />
      <div className="cds-tab-panel">
        <QueryBoundary query={summary} loadingLabel={t('giving.loadingKpis')}>
          {(data) => {
            const ytdTotal = data.funds.reduce((s, f) => s + f.ytd, 0);
            const monthCount = data.channels.reduce((s, c) => s + c.count, 0);
            const budgetTotal = data.funds.reduce((s, f) => s + f.budget, 0);
            const ytdPct = budgetTotal > 0 ? Math.round((ytdTotal / budgetTotal) * 100) : 0;
            return (
              <div className="cds-stack">
                <div className="cds-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                  <Tile
                    label={t('giving.monthToDate')}
                    value={money(data.monthToDate)}
                    caption={monthCount > 0 ? `${monthCount} ${t('giving.donationsThisMonth')}` : t('giving.noDonationsMonth')}
                  />
                  <Tile
                    label={t('giving.ytdAllFunds')}
                    value={money(ytdTotal)}
                    caption={`${ytdPct}% ${t('giving.ofAnnualBudget')} · ${data.funds.length} ${t('giving.funds')}`}
                  >
                    <Meter pct={ytdPct} tone={ytdPct >= 100 ? 'green' : 'blue'} />
                  </Tile>
                </div>

                <div className="cds-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <Panel title={t('giving.byFund')} sub={t('giving.byFundSub')}>
                    {data.funds.length > 0 ? (
                      <div className="cds-fundlist">
                        {data.funds.map((f) => {
                          const pct = f.budget > 0 ? Math.round((f.ytd / f.budget) * 100) : 0;
                          return (
                            <div key={f.id} className="cds-fundrow">
                              <div className="cds-fundrow__head">
                                <span className="cds-fundrow__name">
                                  <span
                                    className="cds-fundrow__dot"
                                    style={{ background: f.accent || 'var(--blue-60)' }}
                                  />
                                  {f.name}
                                </span>
                                <span className="cds-fundrow__amt">
                                  {money(f.ytd)}
                                  <span className="cds-fundrow__budget"> / {money(f.budget)}</span>
                                </span>
                              </div>
                              <Meter pct={pct} tone={pct >= 100 ? 'green' : pct >= 60 ? 'blue' : 'yellow'} />
                              <div className="cds-fundrow__pct">{pct}% {t('giving.ofBudget')}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Empty>{t('giving.noFund')}</Empty>
                    )}
                  </Panel>

                  <Panel title={t('giving.byChannel')} sub={t('giving.byChannelSub')}>
                    {data.channels.length > 0 ? (
                      <div className="cds-fundlist">
                        {(() => {
                          const total = data.channels.reduce((s, c) => s + c.amt, 0) || 1;
                          return data.channels.map((c) => {
                            const share = Math.round((c.amt / total) * 100);
                            return (
                              <div key={c.name} className="cds-fundrow">
                                <div className="cds-fundrow__head">
                                  <span className="cds-fundrow__name">{channelLabel(c.name)}</span>
                                  <span className="cds-fundrow__amt">
                                    {money(c.amt)}
                                    <span className="cds-fundrow__budget"> · {c.count} {t('giving.donationsCount')}</span>
                                  </span>
                                </div>
                                <Meter pct={share} tone="blue" />
                                <div className="cds-fundrow__pct">{share}% {t('giving.ofTotal')}</div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      <Empty icon={<Money size={20} />}>{t('giving.noDonationsMonthDot')}</Empty>
                    )}
                  </Panel>
                </div>

                <Panel
                  title={t('giving.recent')}
                  sub={donations.data ? `${donations.data.length} ${t('giving.lastMovements')}` : undefined}
                  actions={<FreshnessBadge query={donations} />}
                >
                  <QueryBoundary
                    query={donations}
                    isEmpty={(d) => d.length === 0}
                    empty={<Empty icon={<Money size={20} />}>{t('giving.emptyLedger')}</Empty>}
                    loadingLabel={t('giving.loadingLedger')}
                  >
                    {(rows) => (
                      <table className="cds-data-table cds-data-table--compact cds-data-table--zebra">
                        <thead>
                          <tr>
                            <th>{t('giving.colRef')}</th>
                            <th>{t('giving.colDate')}</th>
                            <th>{t('giving.colFund')}</th>
                            <th>{t('giving.colChannel')}</th>
                            <th className="num">{t('giving.colAmount')}</th>
                            <th>{t('giving.colStatus')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((d) => {
                            const fund = data.funds.find((f) => f.id === d.fundId);
                            return (
                              <tr
                                key={d.id}
                                className="is-clickable"
                                tabIndex={0}
                                onClick={() => setDetail(d)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setDetail(d);
                                  }
                                }}
                              >
                                <td className="text-mono">{d.ref}</td>
                                <td className="text-mono">{dateShort(d.createdAt)}</td>
                                <td>
                                  <span className="cds-fund-chip">
                                    <span
                                      className="cds-fundrow__dot"
                                      style={{ background: fund?.accent || 'var(--blue-60)' }}
                                    />
                                    {fund?.name ?? d.fundId}
                                  </span>
                                </td>
                                <td className="text-02">{channelLabel(d.method)}</td>
                                <td className="num" style={{ fontWeight: 600 }}>{money(d.amount)}</td>
                                <td>
                                  <StatusBadge status={d.status} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </QueryBoundary>
                </Panel>
              </div>
            );
          }}
        </QueryBoundary>
      </div>

      {/* ── Détail don ── */}
      <DetailPanel
        open={!!detail}
        onClose={() => setDetail(null)}
        media={detail && <span className="cds-detail-icon"><Money size={22} /></span>}
        eyebrow={t('giving.eyebrow')}
        title={detail ? money(detail.amount) : t('giving.eyebrow')}
        subtitle={detail && <StatusBadge status={detail.status} />}
      >
        {detail && (
          <>
            <DetailLead accent={detail.status === 'failed'}>
              {t('giving.donationOf')} <strong>{money(detail.amount)}</strong> {t('giving.towardFund')}{' '}
              {fundName(detail.fundId, summary.data?.funds ?? [])} {t('giving.fundClose')}, {t('giving.via')}{' '}
              {channelLabel(detail.method)}
              {detail.anonymous ? t('giving.anonymously') : ''}.{' '}
              {donStatusDesc(detail.status)}
            </DetailLead>

            <DetailSection title={t('giving.transaction')}>
              <Field label={t('giving.colRef')}>
                <span className="text-mono">{detail.ref}</span>
              </Field>
              <Field label={t('giving.colAmount')}>{money(detail.amount)}</Field>
              <Field label={t('giving.colFund')}>{fundName(detail.fundId, summary.data?.funds ?? [])}</Field>
              <Field label={t('giving.paymentChannel')}>{channelLabel(detail.method)}</Field>
              <Field label={t('giving.colStatus')} hint={donStatusDesc(detail.status)}>
                <StatusBadge status={detail.status} />
              </Field>
            </DetailSection>

            <DetailSection title={t('giving.donorAndDate')}>
              <Field
                label={t('giving.donor')}
                hint={detail.anonymous ? t('giving.donorAnonHint') : undefined}
              >
                {detail.anonymous ? t('giving.anonymous') : t('people.member')}
              </Field>
              <Field label={t('giving.colDate')}>{new Date(detail.createdAt).toLocaleString(dateLocale())}</Field>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  );
}
