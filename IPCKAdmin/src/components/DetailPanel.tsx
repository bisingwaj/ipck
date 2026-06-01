import { ReactNode, useEffect } from 'react';
import { Close } from '@carbon/icons-react';

/**
 * Drawer de détail latéral — même langage visuel que le reste du dashboard
 * (Carbon plat, tokens `cds-`, angles droits, en-tête sombre). Ouvert au clic
 * sur une ligne de tableau. Ne réinvente aucun style : réutilise `cds-tag`,
 * la grille label/valeur, et les boutons `cds-btn`.
 *
 * Cohérent avec les principes cardinaux : le détail n'affiche que la vérité
 * déjà chargée (principe 1) et les actions y restent confirmées via `useAction`
 * (principe 3) — ce composant n'est qu'une coquille de présentation.
 */
interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Sous-titre / éléments contextuels (ex. statut). */
  subtitle?: ReactNode;
  /** Pied de panneau : boutons d'action (déjà câblés sur useAction). */
  footer?: ReactNode;
  children: ReactNode;
}

export function DetailPanel({ open, onClose, title, subtitle, footer, children }: DetailPanelProps) {
  // Fermeture au clavier (Échap) — guidage et accessibilité.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="cds-detail-overlay" onClick={onClose}>
      <aside
        className="cds-detail"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cds-detail__head">
          <div className="cds-detail__head-text">
            <h3 className="cds-detail__title">{title}</h3>
            {subtitle && <div className="cds-detail__subtitle">{subtitle}</div>}
          </div>
          <button className="cds-detail__close" aria-label="Fermer" onClick={onClose}>
            <Close size={20} />
          </button>
        </header>

        <div className="cds-detail__body">{children}</div>

        {footer && <footer className="cds-detail__footer">{footer}</footer>}
      </aside>
    </div>
  );
}

/** Ligne label / valeur dans le détail (même esprit que le résumé mobile). */
export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="cds-field">
      <div className="cds-field__label">{label}</div>
      <div className="cds-field__value">{children ?? '—'}</div>
    </div>
  );
}

/** Bloc de texte long (méditation, message, description) dans le détail. */
export function DetailText({ children }: { children: ReactNode }) {
  return <div className="cds-detail__text">{children}</div>;
}
