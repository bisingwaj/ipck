import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Money } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Tile, Panel, Empty, StatusBadge, Meter } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, DetailSection, DetailLead, Field } from '../components/DetailPanel';
import { useAction } from '../api/useAction';
import { useAuth } from '../auth/AuthContext';

interface Summary {
  funds: { id: string; name: string; budget: number; ytd: number; accent?: string }[];
  channels: { name: string; amt: number; count: number }[];
  monthToDate: number;
}

// Canaux de paiement → libellé FR (le backend stocke le code brut).
const CHANNEL_LABEL: Record<string, string> = {
  wallet: 'Wallet Amen',
  momo: 'Mobile money',
  mpesa: 'M-Pesa',
  airtel: 'Airtel Money',
  orange: 'Orange Money',
  afrimoney: 'Afrimoney',
  card: 'Carte bancaire',
  cash: 'Espèces',
};
const channelLabel = (c: string) => CHANNEL_LABEL[c] ?? c;

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

/** Date courte FR lisible ("31 mai 2026") au lieu du format US 5/31/2026. */
const dateShort = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

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

const DON_STATUS_DESC: Record<string, string> = {
  received: 'Paiement reçu et réconcilié — comptabilisé dans les totaux du fonds.',
  pending: 'Paiement initié, en attente de confirmation du fournisseur.',
  failed: 'Le paiement a échoué — aucun montant n’a été comptabilisé.',
};

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
      title: 'Exporter les dons en CSV ?',
      message:
        'Un fichier contenant les données financières (montants, donateurs non anonymes) sera téléchargé. Manipulez-le conformément à la confidentialité.',
      confirmLabel: 'Exporter',
    }),
    successTitle: 'Export généré',
    errorTitle: "L'export a échoué",
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
        title="Dons"
        subtitle="Suivi des fonds et des canaux · ledger réconcilié"
        actions={
          mayExport ? (
            <button
              className="cds-btn cds-btn--md"
              onClick={() => exportCsv.run()}
              disabled={exportCsv.isPending}
            >
              {exportCsv.isPending ? 'Export…' : 'Exporter CSV'}
              <Download size={16} />
            </button>
          ) : undefined
        }
      />
      <div className="cds-tab-panel">
        <QueryBoundary query={summary} loadingLabel="Chargement des indicateurs…">
          {(data) => {
            const ytdTotal = data.funds.reduce((s, f) => s + f.ytd, 0);
            const monthCount = data.channels.reduce((s, c) => s + c.count, 0);
            const budgetTotal = data.funds.reduce((s, f) => s + f.budget, 0);
            const ytdPct = budgetTotal > 0 ? Math.round((ytdTotal / budgetTotal) * 100) : 0;
            return (
              <div className="cds-stack">
                <div className="cds-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                  <Tile
                    label="Mois en cours"
                    value={money(data.monthToDate)}
                    caption={monthCount > 0 ? `${monthCount} don(s) reçu(s) ce mois-ci` : 'Aucun don ce mois-ci'}
                  />
                  <Tile
                    label="YTD (tous fonds)"
                    value={money(ytdTotal)}
                    caption={`${ytdPct}% du budget annuel · ${data.funds.length} fonds`}
                  >
                    <Meter pct={ytdPct} tone={ytdPct >= 100 ? 'green' : 'blue'} />
                  </Tile>
                </div>

                <div className="cds-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <Panel title="Par fonds" sub="Progression YTD vs budget annuel">
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
                              <div className="cds-fundrow__pct">{pct}% du budget</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Empty>Aucun fonds</Empty>
                    )}
                  </Panel>

                  <Panel title="Par canal" sub="Répartition du mois en cours">
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
                                    <span className="cds-fundrow__budget"> · {c.count} don(s)</span>
                                  </span>
                                </div>
                                <Meter pct={share} tone="blue" />
                                <div className="cds-fundrow__pct">{share}% du total</div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      <Empty icon={<Money size={20} />}>Aucun don ce mois-ci.</Empty>
                    )}
                  </Panel>
                </div>

                <Panel
                  title="Dons récents"
                  sub={donations.data ? `${donations.data.length} derniers mouvements` : undefined}
                  actions={<FreshnessBadge query={donations} />}
                >
                  <QueryBoundary
                    query={donations}
                    isEmpty={(d) => d.length === 0}
                    empty={<Empty icon={<Money size={20} />}>Aucun don enregistré pour l'instant.</Empty>}
                    loadingLabel="Chargement du ledger…"
                  >
                    {(rows) => (
                      <table className="cds-data-table cds-data-table--compact cds-data-table--zebra">
                        <thead>
                          <tr>
                            <th>Référence</th>
                            <th>Date</th>
                            <th>Fonds</th>
                            <th>Canal</th>
                            <th className="num">Montant</th>
                            <th>Statut</th>
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
        eyebrow="Don"
        title={detail ? money(detail.amount) : 'Don'}
        subtitle={detail && <StatusBadge status={detail.status} />}
      >
        {detail && (
          <>
            <DetailLead accent={detail.status === 'failed'}>
              Don de <strong>{money(detail.amount)}</strong> vers le fonds «{' '}
              {fundName(detail.fundId, summary.data?.funds ?? [])} », via{' '}
              {channelLabel(detail.method)}
              {detail.anonymous ? ', à titre anonyme' : ''}.{' '}
              {DON_STATUS_DESC[detail.status] ?? ''}
            </DetailLead>

            <DetailSection title="Transaction">
              <Field label="Référence">
                <span className="text-mono">{detail.ref}</span>
              </Field>
              <Field label="Montant">{money(detail.amount)}</Field>
              <Field label="Fonds">{fundName(detail.fundId, summary.data?.funds ?? [])}</Field>
              <Field label="Canal de paiement">{channelLabel(detail.method)}</Field>
              <Field label="Statut" hint={DON_STATUS_DESC[detail.status]}>
                <StatusBadge status={detail.status} />
              </Field>
            </DetailSection>

            <DetailSection title="Donateur & date">
              <Field
                label="Donateur"
                hint={detail.anonymous ? 'Le don a été fait de manière anonyme.' : undefined}
              >
                {detail.anonymous ? 'Anonyme' : 'Membre'}
              </Field>
              <Field label="Date">{new Date(detail.createdAt).toLocaleString('fr-FR')}</Field>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  );
}
