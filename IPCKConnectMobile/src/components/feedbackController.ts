// Contrôleur impératif du feedback (toasts + confirm).
// Permet d'appeler toast.success(...) / confirm(...) depuis n'importe quel écran
// sans câbler un hook — le FeedbackProvider enregistre les handlers au montage.

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastInput {
  title: string;
  message?: string;
  variant?: ToastVariant;
}

export interface ConfirmInput {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ShowFn = (t: ToastInput) => void;
type ConfirmFn = (o: ConfirmInput) => Promise<boolean>;

let _show: ShowFn = () => {};
let _confirm: ConfirmFn = async () => false;

/** Appelé une fois par FeedbackProvider pour brancher l'UI. */
export function registerFeedback(show: ShowFn, confirm: ConfirmFn) {
  _show = show;
  _confirm = confirm;
}

/** Toasts éphémères, différenciés par couleur. Remplace Alert.alert(info). */
export const toast = {
  show: (title: string, message?: string, variant: ToastVariant = 'info') => _show({ title, message, variant }),
  success: (title: string, message?: string) => _show({ title, message, variant: 'success' }),
  error: (title: string, message?: string) => _show({ title, message, variant: 'error' }),
  info: (title: string, message?: string) => _show({ title, message, variant: 'info' }),
};

/** Confirmation modale animée. Remplace Alert.alert(..., [boutons]). Résout true/false. */
export function confirm(opts: ConfirmInput): Promise<boolean> {
  return _confirm(opts);
}
