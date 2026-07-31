import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { UserMultiple } from '@carbon/icons-react';
import { PageHead, Panel, Empty, RoleBadge, Avatar } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, DetailSection, DetailLead, Field } from '../components/DetailPanel';
import { t, dateLocale } from '../i18n';

interface Member {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  streakCount: number;
  createdAt: string;
}

const roleDesc = (role: string) => t(`role.desc.${role}`);

const hasName = (m: Member) => !!`${m.firstName ?? ''} ${m.lastName ?? ''}`.trim();
const fullName = (m: { firstName: string | null; lastName: string | null }) =>
  `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || t('people.member');

/** Graine d'avatar : le nom si présent, sinon le téléphone (lignes distinctes). */
const avatarSeed = (m: Member) => (hasName(m) ? fullName(m) : m.phone || m.id);

/** Date courte localisée ("31 mai 2026" / "May 31, 2026"). */
const dateShort = (iso: string) =>
  new Date(iso).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' });

/** Streak : flamme + valeur si actif, "—" discret sinon. */
function Streak({ count }: { count: number }) {
  if (count <= 0) return <span className="text-05">—</span>;
  return (
    <span className="cds-streak" title={`${count} ${t('people.streakDays')}`}>
      <span className="cds-streak__flame">🔥</span>
      {count}
    </span>
  );
}

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
      <PageHead title={t('people.title')} subtitle={t('people.subtitle')} />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          <div className="cds-split" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
            <Panel
              title={t('people.directory')}
              sub={members.data ? `${members.data.length} ${t('people.members')}` : undefined}
              actions={<FreshnessBadge query={members} />}
            >
              <QueryBoundary
                query={members}
                isEmpty={(d) => d.length === 0}
                empty={<Empty icon={<UserMultiple size={20} />}>{t('people.emptyDirectory')}</Empty>}
                loadingLabel={t('people.loadingDirectory')}
              >
                {(rows) => (
                  <table className="cds-data-table cds-data-table--zebra">
                    <thead>
                      <tr>
                        <th>{t('people.colMember')}</th>
                        <th>{t('people.colPhone')}</th>
                        <th>{t('people.colRole')}</th>
                        <th className="num">{t('people.colStreak')}</th>
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
                          <td>
                            <div className="cds-namecell">
                              <Avatar name={avatarSeed(m)} size={28} />
                              <div className="cds-namecell__body">
                                <div className="cds-namecell__title">{fullName(m)}</div>
                                {!hasName(m) && <div className="cds-namecell__sub">{t('people.incompleteProfile')}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="text-mono">{m.phone}</td>
                          <td>
                            <RoleBadge role={m.role} />
                          </td>
                          <td className="num">
                            <Streak count={m.streakCount} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </QueryBoundary>
            </Panel>

            <Panel
              title={t('people.newMembers')}
              sub={fresh.data ? `${fresh.data.length} ${t('people.recent')}` : undefined}
              actions={<FreshnessBadge query={fresh} />}
            >
              <QueryBoundary
                query={fresh}
                isEmpty={(d) => d.length === 0}
                empty={<Empty>{t('people.emptyNew')}</Empty>}
                loadingLabel={t('people.loading')}
              >
                {(rows) => (
                  <table className="cds-data-table cds-data-table--compact">
                    <thead>
                      <tr>
                        <th>{t('people.colMember')}</th>
                        <th>{t('people.colJoined')}</th>
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
                          <td>
                            <div className="cds-namecell">
                              <Avatar name={avatarSeed(m)} size={28} />
                              <div className="cds-namecell__title">{fullName(m)}</div>
                            </div>
                          </td>
                          <td className="text-mono">{dateShort(m.createdAt)}</td>
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
        media={detail && <Avatar name={avatarSeed(detail)} size={44} />}
        eyebrow={t('people.eyebrow')}
        title={detail ? fullName(detail) : t('people.member')}
        subtitle={detail && <RoleBadge role={detail.role} />}
      >
        {detail && (
          <>
            <DetailLead>
              <strong>{fullName(detail)}</strong> {t('people.joinedOn')}{' '}
              {new Date(detail.createdAt).toLocaleDateString(dateLocale(), {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              . {roleDesc(detail.role)}{' '}
              {detail.streakCount > 0
                ? `${t('people.streakOngoing')} ${detail.streakCount} ${t('people.streakDaysShort')}`
                : t('people.noStreak')}
            </DetailLead>

            <DetailSection title={t('people.identity')}>
              <Field label={t('people.name')}>{fullName(detail)}</Field>
              <Field label={t('people.colPhone')}>
                <span className="text-mono">{detail.phone}</span>
              </Field>
              <Field label={t('people.colRole')} hint={roleDesc(detail.role)}>
                <RoleBadge role={detail.role} />
              </Field>
            </DetailSection>

            <DetailSection title={t('people.engagement')}>
              <Field label={t('people.streak')} hint={t('people.streakHint')}>
                <Streak count={detail.streakCount} />
              </Field>
              <Field label={t('people.colJoined')}>{new Date(detail.createdAt).toLocaleString(dateLocale())}</Field>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  );
}
