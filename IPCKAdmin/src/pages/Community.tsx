import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Modal,
  TextInput,
  TextArea,
  DatePicker,
  DatePickerInput,
  ComboBox,
} from '@carbon/react';
import { Add, Group, Events, TrashCan, UserFollow, Chat } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Empty, Avatar } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, DetailSection, DetailLead, Field, DetailText } from '../components/DetailPanel';
import { useAction } from '../api/useAction';
import { useAuth } from '../auth/AuthContext';
import { t, dateLocale } from '../i18n';

interface Group {
  id: string;
  name: string;
  description?: string | null;
  members: number;
  leader: string;
  meets?: string | null;
  color?: string | null;
}

interface EventRow {
  id: string;
  name: string;
  when: string;
  startsAt: string;
  loc?: string | null;
  cap?: number | null;
  rsvp: number;
  color?: string | null;
}

/** Formate un Date local en `YYYY-MM-DD` (valeur du DatePicker). */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Pastille de date (jour + mois) dérivée d'une date ISO, marque "aujourd'hui". */
function EventDate({ iso }: { iso: string }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return <span className="cds-datepill"><span className="cds-datepill__day">—</span></span>;
  }
  const startOf = (x: Date) => {
    const c = new Date(x);
    c.setHours(0, 0, 0, 0);
    return c.getTime();
  };
  const isToday = startOf(d) === startOf(new Date());
  return (
    <span
      className={'cds-datepill' + (isToday ? ' cds-datepill--today' : '')}
      title={d.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
    >
      <span className="cds-datepill__day">{d.getDate()}</span>
      <span className="cds-datepill__mon">{d.toLocaleDateString(dateLocale(), { month: 'short' }).replace('.', '')}</span>
    </span>
  );
}

/** Jauge de remplissage d'un événement (RSVP / capacité). */
function Rsvp({ rsvp, cap }: { rsvp: number; cap?: number | null }) {
  if (!cap) {
    return <span className="cds-rsvp__num"><strong>{rsvp}</strong> RSVP</span>;
  }
  const pct = Math.min(100, Math.round((rsvp / cap) * 100));
  const full = rsvp >= cap;
  return (
    <span className="cds-rsvp">
      <span className="cds-rsvp__num">
        <strong>{rsvp}</strong> / {cap}
      </span>
      <span className="cds-rsvp__bar">
        <span className={'cds-rsvp__fill' + (full ? ' cds-rsvp__fill--full' : '')} style={{ width: `${pct}%` }} />
      </span>
      {full && <span className="cds-rsvp__full">{t('community.full')}</span>}
    </span>
  );
}

interface GroupMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  role: string;
  joinedAt: string;
}
interface DirUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string;
}

const personName = (m: { firstName: string | null; lastName: string | null; phone?: string }) =>
  `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.phone || t('community.member');

/**
 * Section « Membres » du détail de groupe : liste les membres (avatar + retrait)
 * et permet d'ajouter un membre via un sélecteur de l'annuaire. Réservé au staff
 * (le backend revérifie via @Roles('pastor')).
 */
function GroupMembers({ groupId, mayManage }: { groupId: string; mayManage: boolean }) {
  const [picked, setPicked] = useState<DirUser | null>(null);

  const members = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => (await api.get(`/groups/${groupId}/members`)).data as GroupMember[],
  });

  // Annuaire complet (pour le sélecteur d'ajout) — uniquement si gestion permise.
  const directory = useQuery({
    queryKey: ['members'],
    queryFn: async () =>
      (await api.get('/users', { params: { pageSize: 100, sort: 'createdAt:desc' } })).data
        .data as DirUser[],
    enabled: mayManage,
  });

  const add = useAction<DirUser>({
    mutationFn: (u) => api.post(`/groups/${groupId}/members`, { userId: u.id }),
    invalidate: [['group-members', groupId], ['groups']],
    successTitle: t('community.memberAdded'),
    successSubtitle: (_d, u) => personName(u),
    errorTitle: t('community.addFailed'),
    onDone: () => setPicked(null),
  });

  const remove = useAction<GroupMember>({
    mutationFn: (m) => api.delete(`/groups/${groupId}/members/${m.id}`),
    invalidate: [['group-members', groupId], ['groups']],
    confirm: (m) => ({
      title: t('community.confirmRemoveTitle'),
      message: t('community.confirmRemoveMsg').replace('{name}', personName(m)),
      confirmLabel: t('community.remove'),
      danger: true,
    }),
    successTitle: t('community.memberRemoved'),
    errorTitle: t('community.removeFailed'),
  });

  // Exclut les membres déjà présents de la liste d'ajout.
  const memberIds = new Set((members.data ?? []).map((m) => m.id));
  const addable = (directory.data ?? []).filter((u) => !memberIds.has(u.id));

  return (
    <DetailSection title={`${t('community.membersTitle')}${members.data ? ` · ${members.data.length}` : ''}`}>
      {mayManage && (
        <div className="cds-member-add">
          <ComboBox
            id={`add-member-${groupId}`}
            items={addable}
            selectedItem={picked}
            itemToString={(u: DirUser | null) =>
              u ? `${personName(u)} · ${u.phone}` : ''
            }
            placeholder={t('community.searchMember')}
            disabled={directory.isLoading || add.isPending}
            onChange={({ selectedItem }: { selectedItem?: DirUser | null }) => setPicked(selectedItem ?? null)}
            size="sm"
          />
          <button
            className="cds-btn cds-btn--md"
            disabled={!picked || add.isPending}
            onClick={() => picked && add.run(picked)}
          >
            {t('community.add')}
            <UserFollow size={16} />
          </button>
        </div>
      )}

      <QueryBoundary
        query={members}
        isEmpty={(d) => d.length === 0}
        empty={<Empty icon={<Group size={20} />}>{t('community.emptyGroupMembers')}</Empty>}
        loadingLabel={t('community.loadingMembers')}
      >
        {(rows) => (
          <ul className="cds-memberlist">
            {rows.map((m) => (
              <li key={m.id} className="cds-memberlist__item">
                <Avatar name={personName(m)} size={28} />
                <div className="cds-memberlist__body">
                  <div className="cds-memberlist__name">{personName(m)}</div>
                  <div className="cds-memberlist__meta text-mono">{m.phone}</div>
                </div>
                {mayManage && (
                  <button
                    className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                    title={t('community.removeFromGroup')}
                    style={{ color: 'var(--red-60)' }}
                    disabled={remove.isPending}
                    onClick={() => remove.run(m)}
                  >
                    <TrashCan size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </DetailSection>
  );
}

interface GroupMessage {
  id: string;
  who: string;
  authorId: string;
  text: string;
  at: string;
}

/**
 * Conversation d'un groupe pour modération (staff). Affiche les messages et
 * permet de supprimer un message (confirmé). Lecture via /admin/messages
 * (sans condition d'appartenance) ; suppression via DELETE /:id/messages/:msgId.
 */
function GroupConversation({
  group,
  mayManage,
  onClose,
}: {
  group: Group;
  mayManage: boolean;
  onClose: () => void;
}) {
  const messages = useQuery({
    queryKey: ['group-messages', group.id],
    queryFn: async () =>
      (await api.get(`/groups/${group.id}/admin/messages`, { params: { pageSize: 100 } })).data
        .data as GroupMessage[],
  });

  const del = useAction<GroupMessage>({
    mutationFn: (m) => api.delete(`/groups/${group.id}/messages/${m.id}`),
    invalidate: [['group-messages', group.id], ['groups']],
    confirm: (m) => ({
      title: t('community.confirmDeleteMsgTitle'),
      message: t('community.confirmDeleteMsgMsg').replace('{who}', m.who),
      confirmLabel: t('community.deleteMsg'),
      danger: true,
    }),
    successTitle: t('community.msgDeleted'),
    errorTitle: t('community.msgDeleteFailed'),
  });

  return (
    <DetailPanel
      open
      onClose={onClose}
      media={<Avatar name={group.name} color={group.color} size={44} />}
      eyebrow={t('community.conversationEyebrow')}
      title={group.name}
    >
      <QueryBoundary
        query={messages}
        isEmpty={(d) => d.length === 0}
        empty={<Empty icon={<Chat size={20} />}>{t('community.emptyConversation')}</Empty>}
        loadingLabel={t('community.loadingConversation')}
      >
        {(rows) => (
          <div className="cds-chatlog">
            {rows.map((m) => (
              <div key={m.id} className="cds-chatmsg">
                <Avatar name={m.who} size={28} />
                <div className="cds-chatmsg__body">
                  <div className="cds-chatmsg__head">
                    <span className="cds-chatmsg__who">{m.who}</span>
                    <span className="cds-chatmsg__at">
                      {new Date(m.at).toLocaleString(dateLocale(), {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="cds-chatmsg__text">{m.text}</div>
                </div>
                {mayManage && (
                  <button
                    className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                    title={t('community.deleteMessage')}
                    aria-label={t('community.deleteMessage')}
                    style={{ color: 'var(--red-60)' }}
                    disabled={del.isPending}
                    onClick={() => del.run(m)}
                  >
                    <TrashCan size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </QueryBoundary>
    </DetailPanel>
  );
}

export default function Community() {
  const { can } = useAuth();
  const mayManage = can('community.manage');
  const [groupOpen, setGroupOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [group, setGroup] = useState({ name: '', description: '', meets: '' });
  // date = YYYY-MM-DD (DatePicker) · time = HH:MM (input time). startsAt dérivé.
  const [event, setEvent] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    capacity: '',
    description: '',
  });
  const [groupDetail, setGroupDetail] = useState<Group | null>(null);
  const [eventDetail, setEventDetail] = useState<EventRow | null>(null);
  const [convo, setConvo] = useState<Group | null>(null);

  const groups = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await api.get('/groups')).data as Group[],
  });
  const events = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get('/events')).data as EventRow[],
  });

  const createGroup = useAction<void>({
    mutationFn: () =>
      api.post('/groups', {
        name: group.name,
        description: group.description || undefined,
        meets: group.meets || undefined,
      }),
    invalidate: [['groups']],
    successTitle: t('community.groupCreated'),
    successSubtitle: () => group.name,
    errorTitle: t('community.createFailed'),
    onDone: () => {
      setGroupOpen(false);
      setGroup({ name: '', description: '', meets: '' });
    },
  });

  // Combine date (YYYY-MM-DD) + heure (HH:MM) en ISO local, ou '' si incomplet.
  const eventStartsAt =
    event.date && event.time ? new Date(`${event.date}T${event.time}`) : null;

  const createEvent = useAction<void>({
    mutationFn: () =>
      api.post('/events', {
        name: event.name,
        startsAt: eventStartsAt!.toISOString(),
        location: event.location || undefined,
        capacity: event.capacity ? Number(event.capacity) : undefined,
        description: event.description || undefined,
      }),
    invalidate: [['events']],
    successTitle: t('community.eventCreated'),
    successSubtitle: () => event.name,
    errorTitle: t('community.createFailed'),
    onDone: () => {
      setEventOpen(false);
      setEvent({ name: '', date: '', time: '', location: '', capacity: '', description: '' });
    },
  });

  // Validation locale du créneau (principe 2 : guider avant d'envoyer au serveur).
  const canCreateEvent =
    !!event.name.trim() &&
    !!event.date &&
    !!event.time &&
    !!eventStartsAt &&
    !Number.isNaN(eventStartsAt.getTime());

  return (
    <>
      <PageHead title={t('community.title')} subtitle={t('community.subtitle')} />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          <div className="cds-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* Groupes */}
            <Panel
              title={t('community.groups')}
              sub={groups.data ? `${groups.data.length} ${t('community.groupsCount')}` : undefined}
              actions={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <FreshnessBadge query={groups} />
                  {mayManage && (
                    <button className="cds-btn cds-btn--ghost cds-btn--sm" onClick={() => setGroupOpen(true)}>
                      {t('community.newShort')}
                      <Add size={16} />
                    </button>
                  )}
                </span>
              }
            >
              <QueryBoundary
                query={groups}
                isEmpty={(d) => d.length === 0}
                empty={
                  <Empty
                    icon={<Group size={20} />}
                    action={
                      mayManage ? (
                        <button className="cds-btn cds-btn--md" onClick={() => setGroupOpen(true)}>
                          {t('community.newGroup')}
                          <Add size={16} />
                        </button>
                      ) : undefined
                    }
                  >
                    {t('community.emptyGroups')}
                  </Empty>
                }
                loadingLabel={t('community.loadingGroups')}
              >
                {(rows) => (
                  <table className="cds-data-table">
                    <thead>
                      <tr>
                        <th>{t('community.colGroup')}</th>
                        <th>{t('community.colLeader')}</th>
                        <th className="num">{t('community.colMembers')}</th>
                        <th className="num">{t('community.colConversation')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((g) => (
                        <tr
                          key={g.id}
                          className="is-clickable"
                          tabIndex={0}
                          onClick={() => setGroupDetail(g)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setGroupDetail(g);
                            }
                          }}
                        >
                          <td>
                            <div className="cds-namecell">
                              <Avatar name={g.name} color={g.color} />
                              <div className="cds-namecell__body">
                                <div className="cds-namecell__title">{g.name}</div>
                                {g.meets && <div className="cds-namecell__sub">{g.meets}</div>}
                              </div>
                            </div>
                          </td>
                          <td>{g.leader || '—'}</td>
                          <td className="num">{g.members}</td>
                          <td className="num" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="cds-btn cds-btn--ghost cds-btn--sm cds-btn--icon-only"
                              title={t('community.openConversation')}
                              aria-label={t('community.conversationOf').replace('{name}', g.name)}
                              onClick={() => setConvo(g)}
                            >
                              <Chat size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </QueryBoundary>
            </Panel>

            {/* Événements */}
            <Panel
              title={t('community.events')}
              sub={events.data ? `${events.data.length} ${t('community.eventsScheduled')}` : undefined}
              actions={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <FreshnessBadge query={events} />
                  {mayManage && (
                    <button className="cds-btn cds-btn--ghost cds-btn--sm" onClick={() => setEventOpen(true)}>
                      {t('community.newShort')}
                      <Add size={16} />
                    </button>
                  )}
                </span>
              }
            >
              <QueryBoundary
                query={events}
                isEmpty={(d) => d.length === 0}
                empty={
                  <Empty
                    icon={<Events size={20} />}
                    action={
                      mayManage ? (
                        <button className="cds-btn cds-btn--md" onClick={() => setEventOpen(true)}>
                          {t('community.newEvent')}
                          <Add size={16} />
                        </button>
                      ) : undefined
                    }
                  >
                    {t('community.emptyEvents')}
                  </Empty>
                }
                loadingLabel={t('community.loadingEvents')}
              >
                {(rows) => (
                  <table className="cds-data-table">
                    <thead>
                      <tr>
                        <th>{t('community.colWhen')}</th>
                        <th>{t('community.colEvent')}</th>
                        <th className="num">{t('community.colRsvp')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((e) => (
                        <tr
                          key={e.id}
                          className="is-clickable"
                          tabIndex={0}
                          onClick={() => setEventDetail(e)}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                              ev.preventDefault();
                              setEventDetail(e);
                            }
                          }}
                        >
                          <td>
                            <EventDate iso={e.startsAt} />
                          </td>
                          <td>
                            <div className="cds-namecell__title">{e.name}</div>
                            {e.loc && <div className="cds-namecell__sub">{e.loc}</div>}
                          </td>
                          <td className="num">
                            <Rsvp rsvp={e.rsvp} cap={e.cap} />
                          </td>
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

      {/* Modale groupe */}
      <Modal
        open={groupOpen}
        modalHeading={t('community.modalNewGroup')}
        modalLabel={t('community.modalGroupLabel')}
        primaryButtonText={createGroup.isPending ? t('community.creating') : t('community.create')}
        secondaryButtonText={t('community.cancel')}
        primaryButtonDisabled={!group.name.trim() || createGroup.isPending}
        onRequestClose={() => setGroupOpen(false)}
        onRequestSubmit={() => createGroup.run()}
      >
        <div className="cds-form">
          {/* Aperçu identité (avatar + nom) */}
          <div className="cds-namecell" style={{ paddingBottom: 'var(--spacing-04)', borderBottom: '1px solid var(--ui-03)' }}>
            <Avatar name={group.name || t('community.groupFallback')} size={44} />
            <div className="cds-namecell__body">
              <div className="cds-namecell__title">{group.name.trim() || t('community.groupNamePlaceholder')}</div>
              <div className="cds-namecell__sub">{group.meets.trim() || t('community.meetSchedulePlaceholder')}</div>
            </div>
          </div>
          <TextInput id="g-name" labelText={t('community.name')} value={group.name} onChange={(e) => setGroup((g) => ({ ...g, name: e.target.value }))} />
          <TextInput id="g-meets" labelText={t('community.meets')} value={group.meets} onChange={(e) => setGroup((g) => ({ ...g, meets: e.target.value }))} />
          <TextArea id="g-desc" labelText={t('community.description')} rows={3} value={group.description} onChange={(e) => setGroup((g) => ({ ...g, description: e.target.value }))} />
        </div>
      </Modal>

      {/* Modale événement */}
      <Modal
        open={eventOpen}
        modalHeading={t('community.modalNewEvent')}
        modalLabel={t('community.modalEventLabel')}
        primaryButtonText={createEvent.isPending ? t('community.creating') : t('community.create')}
        secondaryButtonText={t('community.cancel')}
        primaryButtonDisabled={!canCreateEvent || createEvent.isPending}
        onRequestClose={() => setEventOpen(false)}
        onRequestSubmit={() => createEvent.run()}
      >
        <div className="cds-form">
          <TextInput id="e-name" labelText={t('community.eventName')} value={event.name} onChange={(e) => setEvent((v) => ({ ...v, name: e.target.value }))} />

          {/* Date (calendrier) + heure */}
          <div className="cds-form__row cds-form__row--2">
            <DatePicker
              datePickerType="single"
              dateFormat="Y-m-d"
              value={event.date || undefined}
              onChange={(dates: Date[]) => setEvent((v) => ({ ...v, date: dates[0] ? toISODate(dates[0]) : '' }))}
            >
              <DatePickerInput id="e-date" labelText={t('community.date')} placeholder="AAAA-MM-JJ" />
            </DatePicker>
            <TextInput
              id="e-time"
              type="time"
              labelText={t('community.time')}
              value={event.time}
              onChange={(e) => setEvent((v) => ({ ...v, time: e.target.value }))}
            />
          </div>

          <div className="cds-form__row cds-form__row--ref">
            <TextInput id="e-loc" labelText={t('community.place')} value={event.location} onChange={(e) => setEvent((v) => ({ ...v, location: e.target.value }))} />
            <TextInput id="e-cap" type="number" min="0" labelText={t('community.capacity')} value={event.capacity} onChange={(e) => setEvent((v) => ({ ...v, capacity: e.target.value }))} />
          </div>
          <TextArea id="e-desc" labelText={t('community.description')} rows={3} value={event.description} onChange={(e) => setEvent((v) => ({ ...v, description: e.target.value }))} />

          {/* Aperçu : pastille de date + nom + capacité */}
          {eventStartsAt && !Number.isNaN(eventStartsAt.getTime()) && (
            <div className="cds-content-preview">
              <EventDate iso={eventStartsAt.toISOString()} />
              <div className="cds-content-preview__body">
                <div className="cds-content-preview__title">{event.name.trim() || t('community.eventNamePlaceholder')}</div>
                <div className="cds-content-preview__sub">
                  {eventStartsAt.toLocaleString(dateLocale(), {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {event.location ? ` · ${event.location}` : ''}
                </div>
                {event.capacity && (
                  <div className="cds-content-preview__badges">
                    <span className="cds-content-preview__dur">{t('community.capacitySeats').replace('{n}', event.capacity)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Détail groupe ── */}
      <DetailPanel
        open={!!groupDetail}
        onClose={() => setGroupDetail(null)}
        media={groupDetail && <Avatar name={groupDetail.name} color={groupDetail.color} size={44} />}
        eyebrow={t('community.groupEyebrow')}
        title={groupDetail?.name ?? t('community.groupFallback')}
      >
        {groupDetail && (
          <>
            <DetailLead>
              {t('community.groupLeadGathering')} <strong>{groupDetail.members}</strong> {t('community.membersLower')}
              {groupDetail.leader ? `${t('community.ledBy')} ${groupDetail.leader}` : ''}
              {groupDetail.meets ? `${t('community.meetsAt')} ${groupDetail.meets}` : ''}.
            </DetailLead>

            <DetailSection title={t('community.description')}>
              <DetailText>{groupDetail.description ?? ''}</DetailText>
            </DetailSection>

            <DetailSection title={t('community.info')}>
              <Field label={t('community.leader')}>{groupDetail.leader || '—'}</Field>
              <Field label={t('community.colMembers')}>{groupDetail.members}</Field>
              <Field label={t('community.meetings')}>{groupDetail.meets || '—'}</Field>
            </DetailSection>

            <GroupMembers groupId={groupDetail.id} mayManage={mayManage} />
          </>
        )}
      </DetailPanel>

      {/* ── Conversation du groupe (modération) ── */}
      {convo && (
        <GroupConversation group={convo} mayManage={mayManage} onClose={() => setConvo(null)} />
      )}

      {/* ── Détail événement ── */}
      <DetailPanel
        open={!!eventDetail}
        onClose={() => setEventDetail(null)}
        media={eventDetail && <EventDate iso={eventDetail.startsAt} />}
        eyebrow={t('community.eventEyebrow')}
        title={eventDetail?.name ?? t('community.eventEyebrow')}
      >
        {eventDetail && (
          <>
            <DetailLead>
              {t('community.eventPlannedOn')}{' '}
              <strong>
                {new Date(eventDetail.startsAt).toLocaleString(dateLocale(), {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
              {eventDetail.loc ? ` ${t('community.atPlace')} ${eventDetail.loc}` : ''}.{' '}
              <strong>{eventDetail.rsvp}</strong> {t('community.confirmedParticipants')}
              {eventDetail.cap ? ` ${t('community.outOfSeats').replace('{n}', String(eventDetail.cap))}` : ''}.
            </DetailLead>

            <DetailSection title={t('community.details')}>
              <Field label={t('community.dateTime')}>
                {new Date(eventDetail.startsAt).toLocaleString(dateLocale())}
              </Field>
              <Field label={t('community.place')}>{eventDetail.loc || '—'}</Field>
              <Field
                label={t('community.participation')}
                hint={
                  eventDetail.cap
                    ? t('community.ofCapacity').replace('{n}', String(Math.round((eventDetail.rsvp / eventDetail.cap) * 100)))
                    : undefined
                }
              >
                {eventDetail.rsvp}
                {eventDetail.cap ? ` / ${eventDetail.cap}` : ' RSVP'}
              </Field>
            </DetailSection>
          </>
        )}
      </DetailPanel>
    </>
  );
}
