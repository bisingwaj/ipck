import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Empty, Tone } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';

interface Member {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  streakCount: number;
  createdAt: string;
}

const roleTone = (r: string): Tone =>
  r === 'admin' ? 'purple' : r === 'pastor' ? 'blue' : r === 'group_leader' ? 'teal' : 'gray';

const fullName = (m: { firstName: string | null; lastName: string | null }) =>
  `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || 'Membre';

export default function People() {
  const members = useQuery({
    queryKey: ['members'],
    queryFn: async () =>
      (await api.get('/users', { params: { pageSize: 100, sort: 'createdAt:desc' } })).data.data as Member[],
  });
  const fresh = useQuery({
    queryKey: ['members-new'],
    queryFn: async () => (await api.get('/users/new')).data as Member[],
  });

  return (
    <>
      <PageHead title="Membres" subtitle="Annuaire de la communauté & nouveaux arrivants" />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          <div className="cds-split" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
            <Panel
              title="Annuaire"
              sub={members.data ? `${members.data.length} membres` : undefined}
              actions={<FreshnessBadge query={members} />}
            >
              <QueryBoundary
                query={members}
                isEmpty={(d) => d.length === 0}
                empty={<Empty>Aucun membre</Empty>}
                loadingLabel="Chargement de l'annuaire…"
              >
                {(rows) => (
                  <table className="cds-data-table">
                    <thead>
                      <tr>
                        <th>Membre</th>
                        <th>Téléphone</th>
                        <th>Rôle</th>
                        <th className="num">Streak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((m) => (
                        <tr key={m.id}>
                          <td>{fullName(m)}</td>
                          <td className="text-mono">{m.phone}</td>
                          <td>
                            <Tag tone={roleTone(m.role)}>{m.role}</Tag>
                          </td>
                          <td className="num">{m.streakCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </QueryBoundary>
            </Panel>

            <Panel
              title="Nouveaux membres"
              sub={fresh.data ? `${fresh.data.length} récents` : undefined}
              actions={<FreshnessBadge query={fresh} />}
            >
              <QueryBoundary
                query={fresh}
                isEmpty={(d) => d.length === 0}
                empty={<Empty>Aucun nouveau membre</Empty>}
                loadingLabel="Chargement…"
              >
                {(rows) => (
                  <table className="cds-data-table cds-data-table--compact">
                    <thead>
                      <tr>
                        <th>Membre</th>
                        <th>Inscrit le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((m) => (
                        <tr key={m.id}>
                          <td>{fullName(m)}</td>
                          <td className="text-mono">{new Date(m.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </QueryBoundary>
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
