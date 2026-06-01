import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { useFeedback } from '../components/feedback';
import { toApiError } from './errors';

/**
 * `useAction` — le cœur des principes 3, 5 et 6 pour toute écriture serveur.
 *
 * Garantit pour CHAQUE action :
 *  3. confirmation préalable (si `confirm`), blocage pendant l'exécution
 *     (`isPending` empêche le double-clic), et retour OBLIGATOIRE (toast succès/erreur).
 *  5. conflits anticipés : un 409 (`CONFLICT`) déclenche un message dédié +
 *     réinvalidation des données pour resynchroniser (rollback de l'optimisme).
 *  6. rien de silencieux : succès ET erreur produisent un toast.
 *
 * La vérité reste serveur (principe 1) : après succès on invalide les `invalidate`
 * keys pour re-télécharger l'état réel plutôt que de présumer le résultat.
 */
interface ActionConfig<TArgs, TData> {
  mutationFn: (args: TArgs) => Promise<TData>;
  /** Clés react-query à invalider après succès (resync depuis le serveur). */
  invalidate?: (string | (string | number)[])[];
  /** Message de confirmation (principe 3). Si absent, exécution directe. */
  confirm?: (args: TArgs) => { title: string; message: string; confirmLabel?: string; danger?: boolean };
  /** Titre du toast de succès (principe 6). */
  successTitle: string | ((data: TData, args: TArgs) => string);
  successSubtitle?: string | ((data: TData, args: TArgs) => string | undefined);
  /** Préfixe du toast d'erreur (le message serveur est ajouté). */
  errorTitle?: string;
  /** Callback succès additionnel (ex. fermer une modale). */
  onDone?: (data: TData, args: TArgs) => void;
}

export interface Action<TArgs, TData> {
  /** Lance l'action : confirme (si besoin), exécute, signale. */
  run: (args: TArgs) => Promise<void>;
  isPending: boolean;
  mutation: UseMutationResult<TData, unknown, TArgs>;
}

export function useAction<TArgs = void, TData = unknown>(
  config: ActionConfig<TArgs, TData>,
): Action<TArgs, TData> {
  const qc = useQueryClient();
  const { toast, confirm } = useFeedback();

  const mutation = useMutation<TData, unknown, TArgs>({
    mutationFn: config.mutationFn,
    onSuccess: (data, args) => {
      for (const key of config.invalidate ?? []) {
        qc.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
      }
      const title =
        typeof config.successTitle === 'function' ? config.successTitle(data, args) : config.successTitle;
      const subtitle =
        typeof config.successSubtitle === 'function'
          ? config.successSubtitle(data, args)
          : config.successSubtitle;
      toast('success', title, subtitle);
      config.onDone?.(data, args);
    },
    onError: (err, args) => {
      const e = toApiError(err);
      if (e.isConflict) {
        // Principe 5 : conflit → on resynchronise et on guide l'admin.
        for (const key of config.invalidate ?? []) {
          qc.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
        }
        toast('warning', 'Conflit détecté', e.message);
        return;
      }
      toast('error', config.errorTitle ?? "L'action a échoué", e.message);
      void args;
    },
  });

  const run = async (args: TArgs) => {
    // Anti double-soumission (principe 3 : blocage temporaire).
    if (mutation.isPending) return;

    if (config.confirm) {
      const opts = config.confirm(args);
      const ok = await confirm({
        title: opts.title,
        message: opts.message,
        confirmLabel: opts.confirmLabel,
        danger: opts.danger,
      });
      if (!ok) return;
    }

    try {
      await mutation.mutateAsync(args);
    } catch {
      // Erreur déjà signalée via onError (toast). On l'absorbe pour ne pas
      // casser le flux UI ; l'état d'échec reste lisible via mutation.isError.
    }
  };

  return { run, isPending: mutation.isPending, mutation };
}
