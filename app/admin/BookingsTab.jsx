'use client';

import { useMemo, useState } from 'react';
import { CalendarIcon } from '@/components/Icons';
import { toast } from '@/components/Toast';
import { useBookings } from '@/lib/store';
import { STATUS_LABEL } from '@/lib/constants';
import { formatDateShort, formatPrice, toISODate } from '@/lib/format';
import BookingModal from './BookingModal';

export default function BookingsTab() {
  const { bookings, ready } = useBookings();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('');
  const [openRef, setOpenRef] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings
      .filter((b) => {
        if (status && b.status !== status) return false;
        if (mode && b.mode !== mode) return false;
        if (!q) return true;
        return `${b.ref} ${b.client.fullname} ${b.client.phone} ${b.client.business}`
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => (`${a.date}${a.time}` < `${b.date}${b.time}` ? 1 : -1));
  }, [bookings, search, status, mode]);

  const kpis = useMemo(() => {
    const todayISO = toISODate(new Date());
    const active = bookings.filter((b) => b.status !== 'annule');
    return {
      total: bookings.length,
      upcoming: active.filter((b) => b.date >= todayISO).length,
      nouveaux: bookings.filter((b) => b.status === 'nouveau').length,
      revenue: active.reduce((sum, b) => sum + Number(b.pkg.price || 0), 0)
    };
  }, [bookings]);

  function exportCSV() {
    if (!filtered.length) {
      toast('Rien à exporter.');
      return;
    }
    const head = ['Reference', 'Cree le', 'Statut', 'Format', 'Date', 'Heure', 'Formule',
      'Montant FCFA', 'Client', 'Telephone', 'Email', 'Activite', 'Secteur', 'Ville',
      'Produits', 'Photos'];

    const rows = filtered.map((b) => [
      b.ref,
      new Date(b.createdAt).toLocaleString('fr-FR'),
      STATUS_LABEL[b.status],
      b.mode === 'presentiel' ? 'Presentiel' : 'Distance',
      b.date, b.time,
      `${b.pkg.name} - ${b.pkg.duration}`,
      b.pkg.price,
      b.client.fullname, b.client.phone, b.client.email,
      b.client.business, b.client.sector, b.client.city,
      b.products.map((p) => p.name + (p.price ? ` (${p.price})` : '')).join(' | '),
      b.products.reduce((n, p) => n + (p.images?.length || 0), 0)
    ]);

    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocd-live-reservations-${toISODate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Export téléchargé.');
  }

  return (
    <section>
      <div className="kpi-grid">
        <div className="kpi">
          <span>Réservations au total</span>
          <b>{kpis.total}</b>
        </div>
        <div className="kpi">
          <span>Lives à venir</span>
          <b>{kpis.upcoming}</b>
        </div>
        <div className="kpi accent">
          <span>À traiter</span>
          <b>{kpis.nouveaux}</b>
        </div>
        <div className="kpi">
          <span>Chiffre d’affaires engagé</span>
          <b>{formatPrice(kpis.revenue)}</b>
        </div>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Rechercher un nom, une référence, un numéro…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="">Tous les formats</option>
          <option value="presentiel">Présentiel</option>
          <option value="distance">À distance</option>
        </select>
        <div className="spacer" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={exportCSV}>
          Exporter en CSV
        </button>
      </div>

      {filtered.length > 0 && (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Client</th>
              <th>Date du live</th>
              <th>Format</th>
              <th>Formule</th>
              <th>Montant</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.ref}>
                <td className="ref-cell">
                  {b.ref}
                  <span className="sub">{new Date(b.createdAt).toLocaleDateString('fr-FR')}</span>
                </td>
                <td>
                  <b>{b.client.fullname}</b>
                  <span className="sub">
                    {b.client.business} · {b.client.phone}
                  </span>
                </td>
                <td>
                  {formatDateShort(b.date)}
                  <span className="sub">{b.time}</span>
                </td>
                <td>
                  <span className={`badge mode-${b.mode}`}>
                    {b.mode === 'presentiel' ? 'Présentiel' : 'Distance'}
                  </span>
                </td>
                <td>
                  {b.pkg.name}
                  <span className="sub">{b.pkg.duration}</span>
                </td>
                <td>
                  <b>{formatPrice(b.pkg.price)}</b>
                </td>
                <td>
                  <span className={`badge ${b.status}`}>{STATUS_LABEL[b.status]}</span>
                </td>
                <td>
                  <div className="row-actions">
                    <button type="button" onClick={() => setOpenRef(b.ref)}>
                      Ouvrir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
      )}

      {/* Même liste, en cartes : lisible sur un téléphone */}
      <div className="booking-cards">
        {filtered.map((b) => (
          <button key={b.ref} type="button" className="booking-card" onClick={() => setOpenRef(b.ref)}>
            <div className="booking-card-top">
              <span className="booking-card-ref">{b.ref}</span>
              <span className={`badge ${b.status}`}>{STATUS_LABEL[b.status]}</span>
            </div>
            <h4>{b.client.fullname}</h4>
            <p className="booking-card-meta">
              {b.client.business} · {b.client.phone}
            </p>
            <p className="booking-card-meta">
              {formatDateShort(b.date)} à {b.time} ·{' '}
              {b.mode === 'presentiel' ? 'Présentiel' : 'À distance'}
            </p>
            <div className="booking-card-foot">
              <span className="sub">{b.pkg.name}</span>
              <b>{formatPrice(b.pkg.price)}</b>
            </div>
          </button>
        ))}
      </div>

      {ready && filtered.length === 0 && (
        <div className="card empty-state">
          <CalendarIcon />
          <p>
            {bookings.length === 0
              ? 'Aucune réservation pour le moment.'
              : 'Aucune réservation ne correspond à cette recherche.'}
          </p>
        </div>
      )}

      {openRef && <BookingModal refId={openRef} onClose={() => setOpenRef(null)} />}
    </section>
  );
}
