'use client';

import { formatPrice, isSubscription } from '@/lib/format';
import { Check } from './Icons';

/**
 * Carte de formule.
 * - `selectable` : rendue dans un <label> avec un vrai bouton radio (étape 4)
 * - sinon : simple vitrine non cliquable (page d'accueil)
 */
export default function PackageCard({ pack, selected = false, selectable = false, inputName, onSelect }) {
  let period = null;
  if (isSubscription(pack)) {
    period = pack.id.includes('3') ? 'semaine' : 'mois';
  }

  let pickLabel = 'Disponible à la réservation';
  if (selectable) {
    pickLabel = selected ? 'Formule choisie' : 'Choisir cette formule';
  }

  const saving = pack.compareAt && pack.compareAt > pack.price ? pack.compareAt - pack.price : 0;

  const card = (
    <div className={`pack${selected ? ' selected' : ''}`}>
      {pack.tag && (
        <span className={`pack-tag${pack.tag === 'Abonnement' ? ' sub' : ''}`}>{pack.tag}</span>
      )}

      <div className="pack-top">
        <h3>{pack.name}</h3>
        <div className="dur">{pack.duration}</div>
      </div>

      <div className="price">
        {formatPrice(pack.price)}
        {period && <small> / {period}</small>}
      </div>

      {saving > 0 && (
        <p className="pack-saving">
          <s>{formatPrice(pack.compareAt)}</s>
          <span>Économie de {formatPrice(saving)}</span>
        </p>
      )}

      <ul>
        {pack.perks.map((perk) => (
          <li key={perk}>
            <Check size={14} />
            {perk}
          </li>
        ))}
      </ul>

      <div className="pack-pick" style={selectable ? undefined : { background: 'var(--line-2)' }}>
        {pickLabel}
      </div>
    </div>
  );

  if (!selectable) return card;

  return (
    <label className="choice">
      <input
        type="radio"
        name={inputName}
        value={pack.id}
        checked={selected}
        aria-label={`Formule ${pack.name}, ${pack.duration}, ${formatPrice(pack.price)}`}
        onChange={() => onSelect(pack)}
      />
      {card}
    </label>
  );
}
