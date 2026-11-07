'use client';

/* ============================================================
   ÉTAPE 2 / 5 — Date et heure
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from '@/components/Calendar';
import StepHead from '@/components/StepHead';
import StepNav from '@/components/StepNav';
import { useDraft } from '@/lib/draft';
import {
  useSettings, getBookings, getBlockedDates,
  slotsFor, closedWeekdays, isPastSlot, onChange
} from '@/lib/store';
import { formatDateFr } from '@/lib/format';

export default function DatePage() {
  const router = useRouter();
  const settings = useSettings();
  const { draft, ready, patch } = useDraft(['mode']);

  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [view, setView] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    const refresh = () => {
      setBookings(getBookings());
      setBlocked(getBlockedDates());
    };
    refresh();
    return onChange(refresh);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (draft.date) {
      setDate(draft.date);
      const [y, m] = draft.date.split('-').map(Number);
      setView(new Date(y, m - 1, 1));
    }
    if (draft.time) setTime(draft.time);
  }, [ready, draft.date, draft.time]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const minMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const maxMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 2, 1), [today]);

  const mode = draft.mode;
  const allSlots = mode ? slotsFor(settings, mode) : [];

  const takenOn = (iso) =>
    bookings
      .filter((b) => b.date === iso && b.mode === mode && b.status !== 'annule')
      .map((b) => b.time);

  const freeCount = (iso) =>
    allSlots.filter((t) => !takenOn(iso).includes(t) && !isPastSlot(iso, t)).length;

  function getDayState(iso, dateObj) {
    if (dateObj < today) return { disabled: true, title: 'Jour passé' };
    if (blocked.includes(iso)) return { disabled: true, title: 'Studio fermé ce jour' };
    if (closedWeekdays(settings, mode).includes(dateObj.getDay())) {
      return { disabled: true, title: 'Fermé ce jour de la semaine' };
    }
    const free = freeCount(iso);
    if (free === 0) return { disabled: true, title: 'Complet' };
    return {
      selected: iso === date,
      badge: free,
      title: `${free} créneau${free > 1 ? 'x' : ''} libre${free > 1 ? 's' : ''}`
    };
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!date) {
      setError('Choisissez un jour dans le calendrier.');
      return;
    }
    if (!time) {
      setError('Choisissez une heure de passage.');
      return;
    }
    patch({ date, time });
    router.push('/reservation/informations');
  }

  if (!ready) {
    return (
      <div className="loading">
        <div className="spinner" />
        Chargement de votre réservation…
      </div>
    );
  }

  const taken = date ? takenOn(date) : [];

  return (
    <form onSubmit={handleSubmit} noValidate>
      <StepHead
        step={2}
        title="Quand passez-vous en direct ?"
        subtitle={
          mode === 'presentiel'
            ? 'Studio de Lomé, ouvert du lundi au samedi. Le chiffre sur un jour indique les créneaux encore libres.'
            : 'Live à distance, disponible 7j/7 jusqu’à 21h. Le chiffre sur un jour indique les créneaux encore libres.'
        }
      />

      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}

      <div className="date-layout">
        <Calendar
          view={view}
          onPrev={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          onNext={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          prevDisabled={view <= minMonth}
          nextDisabled={view >= maxMonth}
          getDayState={getDayState}
          onPick={(iso) => {
            setDate(iso);
            setTime(null);
            setError('');
          }}
          legend={
            <div className="cal-legend">
              <span>
                <i style={{ background: 'var(--line-2)' }} />
                Disponible
              </span>
              <span>
                <i style={{ background: 'var(--orange)' }} />
                Choisi
              </span>
              <span>
                <i style={{ background: '#fff', boxShadow: 'inset 0 0 0 1.5px var(--ink)' }} />
                Aujourd’hui
              </span>
              <span>
                <i style={{ background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--line)' }} />
                Fermé ou complet
              </span>
            </div>
          }
        />

        <div className="card slots-panel">
          <h2 className="panel-title">
            {date ? 'Heure de passage' : 'Choisissez d’abord un jour'}
            {date && <span className="panel-subtitle">{formatDateFr(date)}</span>}
          </h2>

          {date ? (
            <>
              <div className="slot-grid">
                {allSlots.map((t) => {
                  const busy = taken.includes(t) || isPastSlot(date, t);
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`slot${time === t ? ' selected' : ''}`}
                      disabled={busy}
                      title={busy ? 'Créneau indisponible' : `Réserver à ${t}`}
                      onClick={() => {
                        setTime(t);
                        setError('');
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              <p className="panel-note">
                Les créneaux barrés sont déjà pris. Arrivez 20 minutes avant l’heure choisie.
              </p>
            </>
          ) : (
            <p className="empty-note">
              Sélectionnez une date dans le calendrier : les heures disponibles s’afficheront ici.
            </p>
          )}
        </div>
      </div>

      <StepNav
        backHref="/reservation/format"
        backLabel="Format"
        submitLabel="Continuer"
        disabled={!date || !time}
        hint={date && time ? 'Le ' : null}
        hintStrong={date && time ? `${formatDateFr(date)} à ${time}` : null}
      />
    </form>
  );
}
