'use client';

import { MOIS } from '@/lib/constants';
import { toISODate } from '@/lib/format';
import { ChevronLeft, ChevronRight } from './Icons';

const DOW = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

/**
 * Grille mensuelle réutilisable (tunnel de réservation et espace équipe).
 * `getDayState(iso, dateObj)` renvoie { disabled, selected, badge, title, style }.
 */
export default function Calendar({
  view,
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  getDayState,
  onPick,
  legend = null
}) {
  const year = view.getFullYear();
  const month = view.getMonth();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // semaine du lundi
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = toISODate(new Date());

  const cells = [];
  for (let i = 0; i < offset; i++) {
    cells.push(<div key={`empty-${i}`} className="cal-day empty" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const iso = toISODate(dateObj);
    const state = getDayState(iso, dateObj) || {};
    const classes = ['cal-day'];
    if (iso === todayISO) classes.push('today');
    if (state.selected) classes.push('selected');

    cells.push(
      <button
        key={iso}
        type="button"
        className={classes.join(' ')}
        style={state.style}
        disabled={state.disabled}
        title={state.title}
        onClick={() => onPick && onPick(iso)}
      >
        {d}
        {state.badge != null && (
          <span className="free" style={state.badgeStyle}>
            {state.badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="card calendar">
      <div className="cal-head">
        <div className="cal-title">
          {MOIS[month]} {year}
        </div>
        <div className="cal-nav">
          <button type="button" className="cal-btn" onClick={onPrev} disabled={prevDisabled} aria-label="Mois précédent">
            <ChevronLeft />
          </button>
          <button type="button" className="cal-btn" onClick={onNext} disabled={nextDisabled} aria-label="Mois suivant">
            <ChevronRight />
          </button>
        </div>
      </div>

      <div className="cal-grid">
        {DOW.map((d) => (
          <div key={d} className="cal-dow">
            {d}
          </div>
        ))}
        {cells}
      </div>

      {legend}
    </div>
  );
}
