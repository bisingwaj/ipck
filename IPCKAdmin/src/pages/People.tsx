import { useQuery } from '@tanstack/react-query';
import { Loading, InlineNotification } from '@carbon/react';
import { api } from '../api/client';
import { PageHead, Panel, Tag, Empty, Tone } from '../components/ui';

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
      (await api.get('/users', { params: { pageSize: 100, sort: 'createdAt:desc' } })).data
        .data as Member[],
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
            {/* Annuaire */}
            <Panel
              title="Annuaire"
              sub={members.data ? `${members.data.length} membres` : undefined}
            >
              {members.isLoading ? (
                <Loading withOverlay={false} />
              ) : members.error ? (
                <InlineNotification kind="error" title="Erreur de chargement" lowContrast />
              ) : members.data && members.data.length > 0 ? (
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
                    {members.data.map((m) => (
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
              ) : (
                <Empty>Aucun membre</Empty>
              )}
            </Panel>

            {/* Nouveaux membres */}
            <Panel
              title="Nouveaux membres"
              sub={fresh.data ? `${fresh.data.length} récents` : undefined}
            >
              {fresh.isLoading ? (
                <Loading withOverlay={false} />
              ) : fresh.data && fresh.data.length > 0 ? (
                <table className="cds-data-table cds-data-table--compact">
                  <thead>
                    <tr>
                      <th>Membre</th>
                      <th>Inscrit le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fresh.data.map((m) => (
                      <tr key={m.id}>
                        <td>{fullName(m)}</td>
                        <td className="text-mono">{new Date(m.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Empty>Aucun nouveau membre</Empty>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
