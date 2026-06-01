import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { UserMultiple } from '@carbon/icons-react';
import { PageHead, Panel, Empty, RoleBadge } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, DetailSection, DetailLead, Field } from '../components/DetailPanel';

interface Member {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  streakCount: number;
  createdAt: string;
}

const ROLE_DESC: Record<string, string> = {
  admin: 'Administrateur — accès complet au dashboard, dont les exports financiers.',
  pastor: 'Pasteur — gère le soin pastoral, les contenus et la communauté.',
  group_leader: 'Responsable de groupe — anime un groupe de maison.',
  member: 'Membre de la communauté — utilise l’app mobile.',
};

const fullName = (m: { firstName: string | null; lastName: string | null }) =>
  `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || 'Membre';

export default function People() {
  const [detail, setDetail] = useState<Member | null>(null);
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
                empty={<Empty icon={<UserMultiple size={20} />}>Aucun membre dans l'annuaire.</Empty>}
                loadingLabel="Chargement de l'annuaire…"
              >
                {(rows) => (
                  <table className="cds-data-table cds-data-table--zebra">
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
                        <tr
                          key={m.id}
                          className="is-clickable"
                          tabIndex={0}
                          onClick={() => setDetail(m)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setDetail(m);
                            }
                          }}
                        >
                          <td>{fullName(m)}</td>
                          <td className="text-mono">{m.phone}</td>
                          <td>
                            <RoleBadge role={m.role} />
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
                        <tr
                          key={m.id}
                          className="is-clickable"
                          tabIndex={0}
                          onClick={() => setDetail(m)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setDetail(m);
                            }
                          }}
                        >
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

      {/* ── Détail membre ── */}
      <DetailPanel
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? fullName(detail) : 'Membre'}
        subtitle={detail && <RoleBadge role={detail.role} />}
      >
        {detail && (
          <>
            <DetailLead>
              <strong>{fullName(detail)}</strong> a rejoint l'IPCK le{' '}
              {new Date(detail.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              . {ROLE_DESC[detail.role] ?? ''}{' '}
              {detail.streakCount > 0
                ? `Série de lecture en cours : ${detail.streakCount} jour(s).`
                : 'Aucune série de lecture en cours.'}
            </DetailLead>

            <DetailSection title="Identité">
              <Field label="Nom">{fullName(detail)}</Field>
              <Field label="Téléphone">
                <span className="text-mono">{detail.phone}</span>
              </Field>
              <Field label="Rôle" hint={ROLE_DESC[detail.role]}>
                <RoleBadge role={detail.role} />
              </Field>
            </DetailSection>

            <DetailSection title="Engagement">
              <Field
                label="Série"
                hint="Nombre de jours consécutifs de lecture de la dévotion."
              >
                {detail.streakCount} jour(s)
              </Field>
              <Field label="Inscrit le">{new Date(detail.createdAt).toLocaleString('fr-FR')}</Field>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  );
}
