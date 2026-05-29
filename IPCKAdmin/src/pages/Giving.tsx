import { useQuery } from '@tanstack/react-query';
import {
  Loading,
  InlineNotification,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
} from '@carbon/react';
import { api } from '../api/client';

interface Summary {
  funds: { id: string; name: string; budget: number; ytd: number }[];
  channels: { name: string; amt: number; count: number }[];
  monthToDate: number;
}

export default function Giving() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['giving-summary'],
    queryFn: async () => (await api.get('/giving/admin/summary')).data as Summary,
  });

  if (isLoading) return <Loading withOverlay={false} />;
  if (error) return <InlineNotification kind="error" title="Erreur de chargement" lowContrast />;

  return (
    <div className="ipck-page">
      <h2>Dons</h2>
      <div className="ipck-kpi" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
        <div>Mois en cours</div>
        <div className="value">${data?.monthToDate.toLocaleString()}</div>
      </div>

      <h3>Par fonds</h3>
      <StructuredListWrapper>
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head>Fonds</StructuredListCell>
            <StructuredListCell head>YTD</StructuredListCell>
            <StructuredListCell head>Budget</StructuredListCell>
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          {data?.funds.map((f) => (
            <StructuredListRow key={f.id}>
              <StructuredListCell>{f.name}</StructuredListCell>
              <StructuredListCell>${f.ytd.toLocaleString()}</StructuredListCell>
              <StructuredListCell>${f.budget.toLocaleString()}</StructuredListCell>
            </StructuredListRow>
          ))}
        </StructuredListBody>
      </StructuredListWrapper>

      <h3 style={{ marginTop: '2rem' }}>Par canal (mois)</h3>
      <StructuredListWrapper>
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head>Canal</StructuredListCell>
            <StructuredListCell head>Montant</StructuredListCell>
            <StructuredListCell head>Transactions</StructuredListCell>
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          {data?.channels.map((c) => (
            <StructuredListRow key={c.name}>
              <StructuredListCell>{c.name}</StructuredListCell>
              <StructuredListCell>${c.amt.toLocaleString()}</StructuredListCell>
              <StructuredListCell>{c.count}</StructuredListCell>
            </StructuredListRow>
          ))}
        </StructuredListBody>
      </StructuredListWrapper>
    </div>
  );
}
