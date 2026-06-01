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
import { Add, Group, Events, TrashCan, UserFollow } from '@carbon/icons-react';
import { api } from '../api/client';
import { PageHead, Panel, Empty, Avatar } from '../components/ui';
import { QueryBoundary, FreshnessBadge } from '../components/state';
import { DetailPanel, DetailSection, DetailLead, Field, DetailText } from '../components/DetailPanel';
import { useAction } from '../api/useAction';
import { useAuth } from '../auth/AuthContext';

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
      title={d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
    >
      <span className="cds-datepill__day">{d.getDate()}</span>
      <span className="cds-datepill__mon">{d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</span>
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
      {full && <span className="cds-rsvp__full">Complet</span>}
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
  `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.phone || 'Membre';

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
    successTitle: 'Membre ajouté',
    successSubtitle: (_d, u) => personName(u),
    errorTitle: "L'ajout a échoué",
    onDone: () => setPicked(null),
  });

  const remove = useAction<GroupMember>({
    mutationFn: (m) => api.delete(`/groups/${groupId}/members/${m.id}`),
    invalidate: [['group-members', groupId], ['groups']],
    confirm: (m) => ({
      title: 'Retirer ce membre ?',
      message: `${personName(m)} sera retiré du groupe.`,
      confirmLabel: 'Retirer',
      danger: true,
    }),
    successTitle: 'Membre retiré',
    errorTitle: 'Le retrait a échoué',
  });

  // Exclut les membres déjà présents de la liste d'ajout.
  const memberIds = new Set((members.data ?? []).map((m) => m.id));
  const addable = (directory.data ?? []).filter((u) => !memberIds.has(u.id));

  return (
    <DetailSection title={`Membres${members.data ? ` · ${members.data.length}` : ''}`}>
      {mayManage && (
        <div className="cds-member-add">
          <ComboBox
            id={`add-member-${groupId}`}
            items={addable}
            selectedItem={picked}
            itemToString={(u: DirUser | null) =>
              u ? `${personName(u)} · ${u.phone}` : ''
            }
            placeholder="Rechercher un membre à ajouter…"
            disabled={directory.isLoading || add.isPending}
            onChange={({ selectedItem }: { selectedItem?: DirUser | null }) => setPicked(selectedItem ?? null)}
            size="sm"
          />
          <button
            className="cds-btn cds-btn--md"
            disabled={!picked || add.isPending}
            onClick={() => picked && add.run(picked)}
          >
            Ajouter
            <UserFollow size={16} />
          </button>
        </div>
      )}

      <QueryBoundary
        query={members}
        isEmpty={(d) => d.length === 0}
        empty={<Empty icon={<Group size={20} />}>Aucun membre dans ce groupe.</Empty>}
        loadingLabel="Chargement des membres…"
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
                    title="Retirer du groupe"
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
    successTitle: 'Groupe créé',
    successSubtitle: () => group.name,
    errorTitle: 'La création a échoué',
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
    successTitle: 'Événement créé',
    successSubtitle: () => event.name,
    errorTitle: 'La création a échoué',
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
      <PageHead title="Communauté" subtitle="Groupes de maison & événements de l'Église" />
      <div className="cds-tab-panel">
        <div className="cds-stack">
          <div className="cds-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* Groupes */}
            <Panel
              title="Groupes"
              sub={groups.data ? `${groups.data.length} groupes` : undefined}
              actions={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <FreshnessBadge query={groups} />
                  {mayManage && (
                    <button className="cds-btn cds-btn--ghost cds-btn--sm" onClick={() => setGroupOpen(true)}>
                      Nouveau
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
                          Nouveau groupe
                          <Add size={16} />
                        </button>
                      ) : undefined
                    }
                  >
                    Aucun groupe de maison pour l'instant.
                  </Empty>
                }
                loadingLabel="Chargement des groupes…"
              >
                {(rows) => (
                  <table className="cds-data-table">
                    <thead>
                      <tr>
                        <th>Groupe</th>
                        <th>Leader</th>
                        <th className="num">Membres</th>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </QueryBoundary>
            </Panel>

            {/* Événements */}
            <Panel
              title="Événements"
              sub={events.data ? `${events.data.length} planifiés` : undefined}
              actions={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <FreshnessBadge query={events} />
                  {mayManage && (
                    <button className="cds-btn cds-btn--ghost cds-btn--sm" onClick={() => setEventOpen(true)}>
                      Nouveau
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
                          Nouvel événement
                          <Add size={16} />
                        </button>
                      ) : undefined
                    }
                  >
                    Aucun événement planifié.
                  </Empty>
                }
                loadingLabel="Chargement des événements…"
              >
                {(rows) => (
                  <table className="cds-data-table">
                    <thead>
                      <tr>
                        <th>Quand</th>
                        <th>Événement</th>
                        <th className="num">RSVP</th>
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
        modalHeading="Nouveau groupe"
        modalLabel="Communauté · groupe de maison"
        primaryButtonText={createGroup.isPending ? 'Création…' : 'Créer'}
        secondaryButtonText="Annuler"
        primaryButtonDisabled={!group.name.trim() || createGroup.isPending}
        onRequestClose={() => setGroupOpen(false)}
        onRequestSubmit={() => createGroup.run()}
      >
        <div className="cds-form">
          {/* Aperçu identité (avatar + nom) */}
          <div className="cds-namecell" style={{ paddingBottom: 'var(--spacing-04)', borderBottom: '1px solid var(--ui-03)' }}>
            <Avatar name={group.name || 'Groupe'} size={44} />
            <div className="cds-namecell__body">
              <div className="cds-namecell__title">{group.name.trim() || 'Nom du groupe'}</div>
              <div className="cds-namecell__sub">{group.meets.trim() || 'Horaire de rencontre'}</div>
            </div>
          </div>
          <TextInput id="g-name" labelText="Nom" value={group.name} onChange={(e) => setGroup((g) => ({ ...g, name: e.target.value }))} />
          <TextInput id="g-meets" labelText="Rencontres (ex. Mardi 19h)" value={group.meets} onChange={(e) => setGroup((g) => ({ ...g, meets: e.target.value }))} />
          <TextArea id="g-desc" labelText="Description" rows={3} value={group.description} onChange={(e) => setGroup((g) => ({ ...g, description: e.target.value }))} />
        </div>
      </Modal>

      {/* Modale événement */}
      <Modal
        open={eventOpen}
        modalHeading="Nouvel événement"
        modalLabel="Communauté · agenda"
        primaryButtonText={createEvent.isPending ? 'Création…' : 'Créer'}
        secondaryButtonText="Annuler"
        primaryButtonDisabled={!canCreateEvent || createEvent.isPending}
        onRequestClose={() => setEventOpen(false)}
        onRequestSubmit={() => createEvent.run()}
      >
        <div className="cds-form">
          <TextInput id="e-name" labelText="Nom de l'événement" value={event.name} onChange={(e) => setEvent((v) => ({ ...v, name: e.target.value }))} />

          {/* Date (calendrier) + heure */}
          <div className="cds-form__row cds-form__row--2">
            <DatePicker
              datePickerType="single"
              dateFormat="Y-m-d"
              value={event.date || undefined}
              onChange={(dates: Date[]) => setEvent((v) => ({ ...v, date: dates[0] ? toISODate(dates[0]) : '' }))}
            >
              <DatePickerInput id="e-date" labelText="Date" placeholder="AAAA-MM-JJ" />
            </DatePicker>
            <TextInput
              id="e-time"
              type="time"
              labelText="Heure"
              value={event.time}
              onChange={(e) => setEvent((v) => ({ ...v, time: e.target.value }))}
            />
          </div>

          <div className="cds-form__row cds-form__row--ref">
            <TextInput id="e-loc" labelText="Lieu" value={event.location} onChange={(e) => setEvent((v) => ({ ...v, location: e.target.value }))} />
            <TextInput id="e-cap" type="number" min="0" labelText="Capacité" value={event.capacity} onChange={(e) => setEvent((v) => ({ ...v, capacity: e.target.value }))} />
          </div>
          <TextArea id="e-desc" labelText="Description" rows={3} value={event.description} onChange={(e) => setEvent((v) => ({ ...v, description: e.target.value }))} />

          {/* Aperçu : pastille de date + nom + capacité */}
          {eventStartsAt && !Number.isNaN(eventStartsAt.getTime()) && (
            <div className="cds-content-preview">
              <EventDate iso={eventStartsAt.toISOString()} />
              <div className="cds-content-preview__body">
                <div className="cds-content-preview__title">{event.name.trim() || "Nom de l'événement"}</div>
                <div className="cds-content-preview__sub">
                  {eventStartsAt.toLocaleString('fr-FR', {
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
                    <span className="cds-content-preview__dur">Capacité : {event.capacity} places</span>
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
        eyebrow="Groupe de maison"
        title={groupDetail?.name ?? 'Groupe'}
      >
        {groupDetail && (
          <>
            <DetailLead>
              Groupe de maison réunissant <strong>{groupDetail.members}</strong> membre(s)
              {groupDetail.leader ? `, animé par ${groupDetail.leader}` : ''}
              {groupDetail.meets ? `. Se réunit ${groupDetail.meets}` : ''}.
            </DetailLead>

            <DetailSection title="Description">
              <DetailText>{groupDetail.description ?? ''}</DetailText>
            </DetailSection>

            <DetailSection title="Informations">
              <Field label="Leader">{groupDetail.leader || '—'}</Field>
              <Field label="Membres">{groupDetail.members}</Field>
              <Field label="Rencontres">{groupDetail.meets || '—'}</Field>
            </DetailSection>

            <GroupMembers groupId={groupDetail.id} mayManage={mayManage} />
          </>
        )}
      </DetailPanel>

      {/* ── Détail événement ── */}
      <DetailPanel
        open={!!eventDetail}
        onClose={() => setEventDetail(null)}
        media={eventDetail && <EventDate iso={eventDetail.startsAt} />}
        eyebrow="Événement"
        title={eventDetail?.name ?? 'Événement'}
      >
        {eventDetail && (
          <>
            <DetailLead>
              Événement prévu le{' '}
              <strong>
                {new Date(eventDetail.startsAt).toLocaleString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
              {eventDetail.loc ? ` à ${eventDetail.loc}` : ''}.{' '}
              <strong>{eventDetail.rsvp}</strong> participant(s) confirmé(s)
              {eventDetail.cap ? ` sur ${eventDetail.cap} places` : ''}.
            </DetailLead>

            <DetailSection title="Détails">
              <Field label="Date & heure">
                {new Date(eventDetail.startsAt).toLocaleString('fr-FR')}
              </Field>
              <Field label="Lieu">{eventDetail.loc || '—'}</Field>
              <Field
                label="Participation"
                hint={
                  eventDetail.cap
                    ? `${Math.round((eventDetail.rsvp / eventDetail.cap) * 100)}% de la capacité`
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
