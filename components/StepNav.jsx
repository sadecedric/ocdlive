'use client';

import Link from 'next/link';

/**
 * Barre d'action de fin d'étape.
 * Sur ordinateur : une ligne sous le formulaire.
 * Sur téléphone : barre fixée en bas de l'écran, toujours accessible
 * au pouce, avec le montant ou le rappel du choix en cours.
 */
export default function StepNav({
  backHref,
  backLabel = 'Retour',
  submitLabel,
  disabled = false,
  busy = false,
  hint = null,
  hintStrong = null
}) {
  return (
    <div className="step-nav">
      {backHref && (
        <Link href={backHref} className="step-back" aria-label={`Revenir à l’étape ${backLabel}`}>
          <span aria-hidden="true">←</span>
          <span className="step-back-label">{backLabel}</span>
        </Link>
      )}

      <div className="step-nav-main">
        {(hint || hintStrong) && (
          <span className="step-hint">
            {hint}
            {hintStrong && <b>{hintStrong}</b>}
          </span>
        )}
        <button type="submit" className="btn btn-primary step-submit" disabled={disabled || busy}>
          {busy ? 'Un instant…' : submitLabel}
        </button>
      </div>
    </div>
  );
}
