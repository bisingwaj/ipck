import { ReactNode, useEffect } from 'react';
import { Close } from '@carbon/icons-react';

/**
 * Drawer de détail latéral — même langage visuel que le reste du dashboard
 * (Carbon plat, tokens `cds-`, angles droits, en-tête sombre). Ouvert au clic
 * sur une ligne de tableau.
 *
 * Objectif : un détail **structuré et descriptif** (pas une recopie de colonnes).
 * Composition recommandée : `DetailLead` (phrase qui décrit l'objet) →
 * `DetailSection` (groupes titrés de `Field`) → `DetailText` (contenus longs).
 *
 * Cohérent avec les principes cardinaux : n'affiche que la vérité déjà chargée
 * (principe 1) ; les actions du pied restent confirmées via `useAction` (principe 3).
 */
interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Visuel d'en-tête (avatar, vignette, pastille de date) — uniforme partout. */
  media?: ReactNode;
  /** Suréticule discret au-dessus du titre (ex. type d'objet). */
  eyebrow?: ReactNode;
  /** Éléments contextuels sous le titre (ex. badges de statut). */
  subtitle?: ReactNode;
  /** Pied de panneau : boutons d'action (déjà câblés sur useAction). */
  footer?: ReactNode;
  children: ReactNode;
}

export function DetailPanel({
  open,
  onClose,
  title,
  media,
  eyebrow,
  subtitle,
  footer,
  children,
}: DetailPanelProps) {
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
      <aside className="cds-detail" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="cds-detail__head">
          {media && <div className="cds-detail__media">{media}</div>}
          <div className="cds-detail__head-text">
            {eyebrow && <div className="cds-detail__eyebrow">{eyebrow}</div>}
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

/**
 * Phrase d'introduction qui **décrit** l'objet en langage naturel, pour que
 * l'admin comprenne de quoi il s'agit avant de lire les champs. Optionnellement
 * accentuée (encadré) pour les informations sensibles.
 */
export function DetailLead({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return <p className={'cds-detail__lead' + (accent ? ' is-accent' : '')}>{children}</p>;
}

/** Groupe titré de champs — structure le détail en sections lisibles. */
export function DetailSection({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="cds-detail__section">
      <div className="cds-detail__section-title">{title}</div>
      <div className="cds-detail__section-body">{children}</div>
    </section>
  );
}

/** Ligne label / valeur. `hint` ajoute une explication sous la valeur. */
export function Field({
  label,
  children,
  hint,
}: {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
}) {
  const empty = children === null || children === undefined || children === '' || children === '—';
  return (
    <div className="cds-field">
      <div className="cds-field__label">{label}</div>
      <div className="cds-field__value">
        {empty ? <span className="cds-field__empty">Non renseigné</span> : children}
        {hint && !empty && <div className="cds-field__hint">{hint}</div>}
      </div>
    </div>
  );
}

/** Bloc de texte long (méditation, message, description) dans le détail. */
export function DetailText({ children }: { children: ReactNode }) {
  if (children === null || children === undefined || children === '') {
    return <p className="cds-detail__empty-text">Aucun contenu fourni.</p>;
  }
  return <div className="cds-detail__text">{children}</div>;
}
