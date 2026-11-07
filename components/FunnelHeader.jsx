'use client';

/* ============================================================
   En-tête du tunnel de réservation.
   Volontairement dépouillé : ni menu de navigation, ni pied de
   page. Rien qui puisse faire sortir le client du parcours par
   inadvertance — seulement sa progression et une sortie claire.
   ============================================================ */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { STEPS } from '@/lib/constants';
import { useSettings } from '@/lib/store';
import { Check, Close } from './Icons';

export default function FunnelHeader() {
  const pathname = usePathname();
  const settings = useSettings();

  const current = STEPS.find((s) => pathname.startsWith(s.href))?.n ?? 1;
  const currentStep = STEPS.find((s) => s.n === current);
  const done = current === STEPS.length;
  const progress = Math.round(((current - 1) / (STEPS.length - 1)) * 100);

  return (
    <header className="funnel-header">
      <div className="funnel-bar">
        <div className="wrap funnel-bar-inner">
          <span className="logo logo-static">
            <span className="logo-mark">
              <svg viewBox="0 0 32 20" fill="none" stroke="#fff" strokeWidth="3.2">
                <circle cx="10" cy="10" r="7.5" />
                <circle cx="22" cy="10" r="7.5" />
              </svg>
            </span>
            <span className="logo-text">
              <span className="o">OCD</span> <span className="l">Live</span>
            </span>
          </span>

          <span className="funnel-count">
            Étape {current} sur {STEPS.length}
            <em>{currentStep?.label}</em>
          </span>

          <div className="funnel-actions">
            <a
              className="funnel-help"
              href={`https://wa.me/${settings.adminPhone}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Besoin d’aide ?
            </a>
            <Link href="/" className="funnel-close" aria-label="Quitter la réservation">
              <Close size={15} />
            </Link>
          </div>
        </div>

        <div className="funnel-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Fil complet : visible à partir de la tablette */}
      <div className="wrap">
        <ol className="stepper">
          {STEPS.map((step, i) => {
            const isDone = step.n < current;
            const isCurrent = step.n === current;
            const cls = `step-pill ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`.trim();
            const inner = (
              <>
                <i>{isDone ? <Check size={13} /> : step.n}</i>
                <span>{step.label}</span>
              </>
            );

            return (
              <li key={step.n} className="step-item">
                {isDone && !done ? (
                  <Link href={step.href} className={cls} title={`Revenir à l’étape ${step.n}`}>
                    {inner}
                  </Link>
                ) : (
                  <div className={cls} aria-current={isCurrent ? 'step' : undefined}>
                    {inner}
                  </div>
                )}
                {i < STEPS.length - 1 && <span className="step-sep" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </div>
    </header>
  );
}
