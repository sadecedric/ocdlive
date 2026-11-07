'use client';

/* ============================================================
   ÉTAPE 1 / 5 — Format du live
   ============================================================ */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StepHead from '@/components/StepHead';
import StepNav from '@/components/StepNav';
import { getDraft, saveDraft } from '@/lib/draft';
import { Pin, Video, Check } from '@/components/Icons';

const OPTIONS = [
  {
    id: 'presentiel',
    icon: <Pin />,
    title: 'En présentiel',
    baseline: 'Au studio OCD Live, à Lomé',
    text: 'Vous venez avec vos produits. Lumière, son, décor et animateur sont prêts avant votre arrivée.',
    points: ['Studio équipé et décor soigné', 'Un animateur avec vous à l’écran', 'Du lundi au samedi'],
    price: 'À partir de 15 000 FCFA'
  },
  {
    id: 'distance',
    icon: <Video />,
    title: 'À distance',
    baseline: 'Depuis chez vous ou votre boutique',
    text: 'Vous filmez avec votre téléphone, on vous connecte, on anime et on diffuse sur nos pages.',
    points: ['Test technique la veille', 'Habillage OCD Live à l’écran', '7j/7, jusqu’à 21h'],
    price: 'À partir de 12 000 FCFA'
  }
];

export default function FormatForm() {
  const router = useRouter();
  const [mode, setMode] = useState(null);
  const [error, setError] = useState('');

  /* Reprise du choix précédent, ou présélection depuis l'accueil via
     /reservation/format?mode=presentiel. On lit l'URL directement plutôt
     qu'avec useSearchParams : la page reste ainsi entièrement prérendue,
     sans écran d'attente à l'entrée du tunnel. */
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('mode');
    if (fromUrl === 'presentiel' || fromUrl === 'distance') {
      setMode(fromUrl);
      return;
    }
    const draft = getDraft();
    if (draft.mode) setMode(draft.mode);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!mode) {
      setError('Choisissez un format pour continuer.');
      return;
    }
    const draft = getDraft();
    // changer de format invalide la date et la formule déjà choisies
    const reset = draft.mode === mode ? {} : { date: null, time: null, pkg: null };
    saveDraft({ ...draft, ...reset, mode });
    router.push('/reservation/date');
  }

  const chosen = OPTIONS.find((o) => o.id === mode);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <StepHead
        step={1}
        title="Quel type de live voulez-vous faire ?"
        subtitle="Deux façons de passer en direct. Vous pourrez changer d’avis à tout moment."
      />

      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}

      <div className="mode-grid">
        {OPTIONS.map((opt) => (
          <label className="choice" key={opt.id}>
            <input
              type="radio"
              name="mode"
              value={opt.id}
              checked={mode === opt.id}
              aria-label={`${opt.title} — ${opt.baseline}`}
              onChange={() => {
                setMode(opt.id);
                setError('');
              }}
            />
            <div className={`mode-card${mode === opt.id ? ' active' : ''}`}>
              <span className="mode-tick" aria-hidden="true">
                <Check size={13} />
              </span>
              <span className="mode-icon">{opt.icon}</span>
              <h2>{opt.title}</h2>
              <p className="mode-baseline">{opt.baseline}</p>
              <p>{opt.text}</p>
              <ul className="mode-points">
                {opt.points.map((p) => (
                  <li key={p}>
                    <Check size={13} />
                    {p}
                  </li>
                ))}
              </ul>
              <span className="mode-price">{opt.price}</span>
            </div>
          </label>
        ))}
      </div>

      <StepNav
        backHref="/"
        backLabel="Accueil"
        submitLabel="Continuer"
        disabled={!mode}
        hint={chosen ? 'Format : ' : null}
        hintStrong={chosen ? chosen.title : null}
      />
    </form>
  );
}
