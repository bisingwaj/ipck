import { useQuery, useMutation } from '@tanstack/react-query';
import { Loading, InlineNotification } from '@carbon/react';
import { Download } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Tile, Panel, Tag, Empty, Tone } from '../components/ui';

interface Summary {
  funds: { id: string; name: string; budget: number; ytd: number }[];
  channels: { name: string; amt: number; count: number }[];
  monthToDate: number;
}

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

const statusTone = (s: string): Tone =>
  s === 'received' ? 'green' : s === 'pending' ? 'yellow' : 'red';

export default function Giving() {
  const summary = useQuery({
    queryKey: ['giving-summary'],
    queryFn: async () => (await api.get('/giving/admin/summary')).data as Summary,
  });
  const donations = useQuery({
    queryKey: ['giving-donations'],
    queryFn: async () =>
      (await api.get('/giving/admin/donations', { params: { pageSize: 50 } })).data
        .data as Donation[],
  });

  const exportCsv = useMutation({
    mutationFn: async () => (await api.get('/giving/admin/export')).data as { csv: string },
    onSuccess: ({ csv }) => {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ipck-dons-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const data = summary.data;
  const ytdTotal = data?.funds.reduce((s, f) => s + f.ytd, 0) ?? 0;
  const fundName = (id: string) => data?.funds.find((f) => f.id === id)?.name ?? id;

  return (
    <>
      <PageHead
        title="Dons"
        subtitle="Suivi des fonds et des canaux · ledger réconcilié"
        actions={
          <button
            className="cds-btn cds-btn--md"
            onClick={() => exportCsv.mutate()}
            disabled={exportCsv.isPending}
          >
            {exportCsv.isPending ? 'Export…' : 'Exporter CSV'}
            <Download size={16} />
          </button>
        }
      />
      <div className="cds-tab-panel">
        {summary.isLoading ? (
          <Loading withOverlay={false} />
        ) : summary.error ? (
          <InlineNotification kind="error" title="Erreur de chargement" lowContrast />
        ) : (
          <div className="cds-stack">
            {exportCsv.isError && (
              <InlineNotification kind="error" title="Échec de l'export" lowContrast />
            )}

            <div className="cds-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <Tile
                label="Mois en cours"
                value={`$${data?.monthToDate.toLocaleString()}`}
                caption="Total reçu ce mois-ci"
              />
              <Tile
                label="YTD (tous fonds)"
                value={`$${ytdTotal.toLocaleString()}`}
                caption={`${data?.funds.length ?? 0} fonds suivis`}
              />
            </div>

            <div className="cds-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Panel title="Par fonds" sub="YTD vs budget">
                {data && data.funds.length > 0 ? (
                  <table className="cds-data-table cds-data-table--compact">
                    <thead>
                      <tr>
                        <th>Fonds</th>
                        <th className="num">YTD</th>
                        <th className="num">Budget</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.funds.map((f) => (
                        <tr key={f.id}>
                          <td>{f.name}</td>
                          <td className="num">${f.ytd.toLocaleString()}</td>
                          <td className="num text-05">${f.budget.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <Empty>Aucun fonds</Empty>
                )}
              </Panel>

              <Panel title="Par canal" sub="Mois en cours">
                {data && data.channels.length > 0 ? (
                  <table className="cds-data-table cds-data-table--compact">
                    <thead>
                      <tr>
                        <th>Canal</th>
                        <th className="num">Montant</th>
                        <th className="num">Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.channels.map((c) => (
                        <tr key={c.name}>
                          <td>{c.name}</td>
                          <td className="num">${c.amt.toLocaleString()}</td>
                          <td className="num text-05">{c.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <Empty>Aucun canal</Empty>
                )}
              </Panel>
            </div>

            <Panel
              title="Dons récents"
              sub={donations.data ? `${donations.data.length} derniers mouvements` : undefined}
            >
              {donations.isLoading ? (
                <Loading withOverlay={false} />
              ) : donations.data && donations.data.length > 0 ? (
                <table className="cds-data-table cds-data-table--compact">
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
                    {donations.data.map((d) => (
                      <tr key={d.id}>
                        <td className="text-mono">{d.ref}</td>
                        <td className="text-mono">{new Date(d.createdAt).toLocaleDateString()}</td>
                        <td>{fundName(d.fundId)}</td>
                        <td>{d.method}</td>
                        <td className="num">${d.amount.toLocaleString()}</td>
                        <td>
                          <Tag tone={statusTone(d.status)}>{d.status}</Tag>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Empty>Aucun don</Empty>
              )}
            </Panel>
          </div>
        )}
      </div>
    </>
  );
}
