'use client';

import { useEffect, useState } from 'react';
import Calendar from '@/components/Calendar';
import { toast } from '@/components/Toast';
import {
  useBookings, getBlockedDates, toggleBlockedDate,
  getSettings, saveSettings, useSettings, onChange
} from '@/lib/store';

export default function DispoTab() {
  const settings = useSettings();
  const { bookings } = useBookings();
  const [blocked, setBlocked] = useState([]);
  const [view, setView] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [slotsP, setSlotsP] = useState('');
  const [slotsD, setSlotsD] = useState('');

  useEffect(() => {
    const refresh = () => setBlocked(getBlockedDates());
    refresh();
    return onChange(refresh);
  }, []);

  useEffect(() => {
    setSlotsP(settings.slotsPresentiel.join('\n'));
    setSlotsD(settings.slotsDistance.join('\n'));
  }, [settings.slotsPresentiel, settings.slotsDistance]);

  const counts = bookings.reduce((acc, b) => {
    if (b.status !== 'annule') acc[b.date] = (acc[b.date] || 0) + 1;
    return acc;
  }, {});

  function getDayState(iso) {
    const isBlocked = blocked.includes(iso);
    const count = counts[iso] || 0;

    let style;
    if (isBlocked) style = { background: 'var(--red)', color: '#fff' };
    else if (count) style = { background: 'var(--orange)', color: '#fff' };

    return {
      style,
      badge: !isBlocked && count ? count : null,
      badgeStyle: { color: '#fff' },
      title: isBlocked
        ? 'Fermé — cliquer pour rouvrir'
        : `${count} live(s) — cliquer pour fermer la journée`
    };
  }

  function saveSlots() {
    const parse = (text) =>
      text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /^\d{1,2}:\d{2}$/.test(l))
        .map((l) => (l.length === 4 ? '0' + l : l));

    const next = { ...getSettings(), slotsPresentiel: parse(slotsP), slotsDistance: parse(slotsD) };
    saveSettings(next);
    toast('Horaires enregistrés.');
  }

  return (
    <section>
      <div className="dispo-note">
        Cliquez sur un jour pour le fermer à la réservation (jour férié, déplacement, studio occupé).
        Recliquez pour le rouvrir.
      </div>

      <div className="dispo-layout">
        <Calendar
          view={view}
          onPrev={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          onNext={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          getDayState={getDayState}
          onPick={(iso) => setBlocked(toggleBlockedDate(iso))}
          legend={
            <div className="cal-legend">
              <span>
                <i style={{ background: 'var(--line-2)' }} />
                Ouvert
              </span>
              <span>
                <i style={{ background: 'var(--red)' }} />
                Fermé
              </span>
              <span>
                <i style={{ background: 'var(--orange)' }} />
                Live programmé
              </span>
            </div>
          }
        />

        <aside className="card form-card">
          <h3>Horaires proposés</h3>
          <p className="hint">Un créneau par ligne, au format HH:MM.</p>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="slots-p">Présentiel (Lomé)</label>
            <textarea id="slots-p" rows={6} value={slotsP} onChange={(e) => setSlotsP(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="slots-d">À distance</label>
            <textarea id="slots-d" rows={6} value={slotsD} onChange={(e) => setSlotsD(e.target.value)} />
          </div>
          <button type="button" className="btn btn-primary btn-block" onClick={saveSlots}>
            Enregistrer les horaires
          </button>
        </aside>
      </div>
    </section>
  );
}
