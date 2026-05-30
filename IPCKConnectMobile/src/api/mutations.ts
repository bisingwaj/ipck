// Hooks de mutation (actions write) par domaine. Même esprit que hooks.ts :
// court-circuit en mode USE_MOCKS (le bouton reste fonctionnel sans backend),
// sinon appel API réel + invalidation des queryKeys littérales de hooks.ts.
import { useMutation } from '@tanstack/react-query';
import { api } from './client';
import { USE_MOCKS } from './config';
import { queryClient } from './queryClient';

/** Invalide une liste de queryKeys (no-op en mode mocks). */
function invalidate(keys: unknown[][]) {
  if (USE_MOCKS) return;
  keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
}

// ───────────────────────── Onboarding ─────────────────────────

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
}

/** PATCH /users/me — n'envoie QUE firstName/lastName (DTO strict, pas d'age). */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (USE_MOCKS) return { ...input };
      return (await api.patch('/users/me', input)).data;
    },
  });
}

/** PUT /users/me/interests */
export function useUpdateInterests() {
  return useMutation({
    mutationFn: async (interests: string[]) => {
      if (USE_MOCKS) return { interests };
      return (await api.put('/users/me/interests', { interests })).data;
    },
  });
}

// ───────────────────────── Today ─────────────────────────

export interface MarkReadResult {
  streakCount: number;
  blessingsAwarded: number; // Blessings gagnés (+10 à la 1re lecture)
  balanceCoins: number;
}

/** POST /devotionals/:id/read → { streakCount, blessingsAwarded } + crédite la Grace Reserve. */
export function useMarkDevotionalRead() {
  return useMutation({
    mutationFn: async (devotionalId: string): Promise<MarkReadResult> => {
      if (USE_MOCKS) return { streakCount: 13, blessingsAwarded: 10, balanceCoins: 0 };
      return (await api.post(`/devotionals/${devotionalId}/read`)).data;
    },
    onSuccess: () => invalidate([['streak'], ['devotional', 'today'], ['devotionals'], ['wallet']]),
  });
}

// ───────────────────────── Give ─────────────────────────

export interface CreateDonationInput {
  amount: number;
  fundId: string;
  method: string;
  anonymous?: boolean;
  phone?: string;
}

export interface DonationResult {
  id: string;
  ref: string;
  amount: number;
  fundId: string;
  method: string;
  status: 'pending' | 'received' | 'failed';
  createdAt: string;
}

/** POST /giving/donations — paiement synchrone (provider mock → received). */
export function useCreateDonation() {
  return useMutation({
    mutationFn: async (input: CreateDonationInput): Promise<DonationResult> => {
      if (USE_MOCKS) {
        return {
          id: `mock-${Date.now()}`,
          ref: 'GFT-024-381',
          amount: input.amount,
          fundId: input.fundId,
          method: input.method,
          status: 'received',
          createdAt: new Date().toISOString(),
        };
      }
      return (await api.post('/giving/donations', input)).data;
    },
    onSuccess: () => invalidate([['donations'], ['wallet']]),
  });
}

export interface TopupInput {
  coins: number;
  method: string;
}

/** POST /giving/wallet/topup */
export function useTopupWallet() {
  return useMutation({
    mutationFn: async (input: TopupInput) => {
      if (USE_MOCKS) return { id: `mock-${Date.now()}`, ...input, status: 'completed' };
      return (await api.post('/giving/wallet/topup', input)).data;
    },
    onSuccess: () => invalidate([['wallet'], ['walletTransactions']]),
  });
}

export interface SendToFundInput {
  coins: number;
  fundId: string;
}

/** POST /giving/wallet/send — débite le wallet et envoie les coins vers un fonds (redeem). */
export function useSendToFund() {
  return useMutation({
    mutationFn: async (input: SendToFundInput): Promise<DonationResult> => {
      if (USE_MOCKS) {
        return {
          id: `mock-${Date.now()}`,
          ref: 'GFT-024-381',
          amount: input.coins,
          fundId: input.fundId,
          method: 'wallet',
          status: 'received',
          createdAt: new Date().toISOString(),
        };
      }
      return (await api.post('/giving/wallet/send', input)).data;
    },
    onSuccess: () => invalidate([['wallet'], ['walletTransactions'], ['donations']]),
  });
}

/** PATCH /giving/wallet/default-fund */
export function useSetDefaultFund() {
  return useMutation({
    mutationFn: async (fundId: string) => {
      if (USE_MOCKS) return { defaultFundId: fundId };
      return (await api.patch('/giving/wallet/default-fund', { fundId })).data;
    },
    onSuccess: () => invalidate([['wallet']]),
  });
}

// ───────────────────────── Community ─────────────────────────

/** POST /groups/:id/join */
export function useJoinGroup() {
  return useMutation({
    mutationFn: async (groupId: string) => {
      if (USE_MOCKS) return { ok: true };
      return (await api.post(`/groups/${groupId}/join`)).data;
    },
    onSuccess: (_d, groupId) =>
      invalidate([['groups', 'mine'], ['groups', 'all'], ['group', groupId]]),
  });
}

export interface GroupMessage {
  id: string;
  who: string;
  authorId: string;
  text: string;
  at: string;
  mine: boolean;
}

/** POST /groups/:id/messages — requiert l'appartenance (sinon 403). */
export function useSendGroupMessage(groupId: string) {
  return useMutation({
    mutationFn: async (text: string): Promise<GroupMessage> => {
      if (USE_MOCKS) {
        return { id: `mock-${Date.now()}`, who: 'You', authorId: 'me', text, at: new Date().toISOString(), mine: true };
      }
      return (await api.post(`/groups/${groupId}/messages`, { text })).data;
    },
    onSuccess: () => invalidate([['groupMessages', groupId]]),
  });
}

export type PrayerVisibility = 'public' | 'anon' | 'private';

export interface CreatePrayerInput {
  text: string;
  visibility: PrayerVisibility;
}

/** POST /prayers — public/anon → mur ; private → file de care (n'apparaît pas au mur). */
export function useCreatePrayer() {
  return useMutation({
    mutationFn: async (input: CreatePrayerInput) => {
      if (USE_MOCKS) return { id: `mock-${Date.now()}`, ...input };
      return (await api.post('/prayers', input)).data;
    },
    onSuccess: () => invalidate([['prayers']]),
  });
}

export interface PrayResult {
  amenCount: number;
  iPrayed: boolean;
  blessingsAwarded: number; // +5 à la 1re fois qu'on soutient cette intention
  balanceCoins?: number;
}

/** POST /prayers/:id/amen → { amenCount, iPrayed, blessingsAwarded } + crédite la Grace Reserve. */
export function usePrayForRequest() {
  return useMutation({
    mutationFn: async (prayerId: string): Promise<PrayResult> => {
      if (USE_MOCKS) return { amenCount: 0, iPrayed: true, blessingsAwarded: 5 };
      return (await api.post(`/prayers/${prayerId}/amen`)).data;
    },
    onSuccess: (_d, prayerId) => invalidate([['prayers'], ['prayer', prayerId], ['wallet']]),
  });
}

export interface EncouragementResult { who: string; initials: string; text: string; at: string }

/** POST /prayers/:id/encouragements — ajoute un mot d'encouragement. */
export function useCreateEncouragement(prayerId: string) {
  return useMutation({
    mutationFn: async (text: string): Promise<EncouragementResult | null> => {
      if (USE_MOCKS) return null;
      return (await api.post(`/prayers/${prayerId}/encouragements`, { text })).data;
    },
    onSuccess: () => invalidate([['prayer', prayerId]]),
  });
}

export type RsvpStatus = 'going' | 'cancelled';

/** POST /events/:id/rsvp — enum backend = going | cancelled. */
export function useRsvpEvent(eventId: string) {
  return useMutation({
    mutationFn: async (status: RsvpStatus) => {
      if (USE_MOCKS) return { myRsvp: status };
      return (await api.post(`/events/${eventId}/rsvp`, { status })).data;
    },
    onSuccess: () => invalidate([['events'], ['event', eventId]]),
  });
}

// ───────────────────────── Rendez-vous ─────────────────────────

export interface CreateAppointmentInput {
  topicId: string;
  slotStart: string;
  notes?: string;
}

/** POST /appointments — prend un rendez-vous. */
export function useCreateAppointment() {
  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      if (USE_MOCKS) return { id: `mock-${Date.now()}`, ...input };
      return (await api.post('/appointments', input)).data;
    },
    onSuccess: () => invalidate([['appt', 'mine'], ['appt', 'slots']]),
  });
}

/** DELETE /appointments/:id — annule un rendez-vous. */
export function useCancelAppointment() {
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCKS) return { ok: true };
      await api.delete(`/appointments/${id}`);
      return { ok: true };
    },
    onSuccess: () => invalidate([['appt', 'mine'], ['appt', 'slots']]),
  });
}

// ───────────────────────── Notifications ─────────────────────────

/** POST /notifications/read — marque tout comme lu. */
export function useMarkNotificationsRead() {
  return useMutation({
    mutationFn: async () => {
      if (USE_MOCKS) return { ok: true };
      return (await api.post('/notifications/read', {})).data;
    },
    onSuccess: () => invalidate([['notifications']]),
  });
}

// ───────────────────────── Live ─────────────────────────

export interface SendAmenResult {
  balanceCoins: number;
  transaction: { id: string; coins: number; status: string };
  amenCount: number;
  amenCoins: number;
}

/** POST /live/:id/amen → { balanceCoins, transaction, amenCount, amenCoins }. 400 INSUFFICIENT_BALANCE si solde insuffisant. */
export function useSendLiveAmen(sessionId: string | undefined) {
  return useMutation({
    mutationFn: async (coins: number): Promise<SendAmenResult> => {
      if (USE_MOCKS) {
        return { balanceCoins: 0, transaction: { id: `mock-${Date.now()}`, coins: -coins, status: 'completed' }, amenCount: 0, amenCoins: 0 };
      }
      if (!sessionId) throw new Error('No live session');
      return (await api.post(`/live/${sessionId}/amen`, { coins })).data;
    },
    onSuccess: () => invalidate([['wallet'], ['live', 'current']]),
  });
}
