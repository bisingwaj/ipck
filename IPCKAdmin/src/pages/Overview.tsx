import { useQuery } from '@tanstack/react-query';
import { Loading, InlineNotification } from '@carbon/react';
import { api } from '../api/client';

interface Kpi {
  id: string;
  label: string;
  value: number;
  live?: boolean;
}

export default function Overview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['overview'],
    queryFn: async () => (await api.get('/admin/overview')).data as { kpis: Kpi[] },
  });

  if (isLoading) return <Loading withOverlay={false} />;
  if (error) return <InlineNotification kind="error" title="Erreur de chargement" lowContrast />;

  return (
    <div className="ipck-page">
      <h2>Vue d'ensemble</h2>
      <div className="ipck-kpis">
        {data?.kpis.map((k) => (
          <div className="ipck-kpi" key={k.id}>
            <div>{k.label}</div>
            <div className="value">{k.value.toLocaleString()}</div>
            {k.live ? <small>● en direct</small> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
