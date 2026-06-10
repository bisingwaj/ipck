import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { CheckmarkFilled, ErrorFilled, InformationFilled, WarningFilled, Close } from '@carbon/icons-react';
import { t as tr } from '../i18n';

/**
 * Principe 6 (rien de silencieux) & 3 (retour obligatoire) :
 * - `toast` garantit qu'aucune action ne se termine sans retour visible.
 * - `confirm` garantit qu'aucune action sensible ne part sans validation explicite.
 * Les deux sont fournis globalement pour être appelés depuis n'importe quelle page.
 */

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  subtitle?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface FeedbackApi {
  toast: (kind: ToastKind, title: string, subtitle?: string) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

const TOAST_TTL = 6000;

const ICONS: Record<ToastKind, typeof CheckmarkFilled> = {
  success: CheckmarkFilled,
  error: ErrorFilled,
  info: InformationFilled,
  warning: WarningFilled,
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (kind: ToastKind, title: string, subtitle?: string) => {
      const id = ++seq.current;
      setToasts((list) => [...list, { id, kind, title, subtitle }]);
      // Les erreurs persistent (l'admin doit les voir) ; le reste s'efface seul.
      if (kind !== 'error') {
        window.setTimeout(() => dismiss(id), TOAST_TTL);
      }
    },
    [dismiss],
  );

  const confirm = useCallback((opts: ConfirmOptions) => {
    setConfirmState(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const closeConfirm = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setConfirmState(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      {/* ── Toasts ── */}
      <div className="cds-toasts" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div key={t.id} className={`cds-toast cds-toast--${t.kind}`}>
              <span className="cds-toast__icon">
                <Icon size={20} />
              </span>
              <div className="cds-toast__content">
                <div className="cds-toast__title">{t.title}</div>
                {t.subtitle && <div className="cds-toast__subtitle">{t.subtitle}</div>}
              </div>
              <button
                className="cds-toast__close"
                aria-label={tr('toast.close')}
                onClick={() => dismiss(t.id)}
              >
                <Close size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Confirmation (principe 3) ── */}
      {confirmState && (
        <div className="cds-confirm-overlay" role="dialog" aria-modal="true">
          <div className="cds-confirm">
            <h3 className="cds-confirm__title">{confirmState.title}</h3>
            <p className="cds-confirm__message">{confirmState.message}</p>
            <div className="cds-confirm__actions">
              <button className="cds-btn cds-btn--ghost cds-btn--md" onClick={() => closeConfirm(false)}>
                {confirmState.cancelLabel ?? tr('confirm.cancel')}
              </button>
              <button
                className={
                  'cds-btn cds-btn--md' + (confirmState.danger ? ' cds-btn--danger' : '')
                }
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmLabel ?? tr('confirm.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback doit être utilisé dans FeedbackProvider');
  return ctx;
}
