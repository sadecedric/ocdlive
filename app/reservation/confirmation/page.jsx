'use client';

/* ============================================================
   ÉTAPE 5 / 5 — Confirmation
   ============================================================ */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check } from '@/components/Icons';
import { getDraft, clearDraft } from '@/lib/draft';
import { getBooking, useSettings } from '@/lib/store';
import { formatDateFr, formatPrice, pad, pkgHours } from '@/lib/format';
import { modeLabel } from '@/lib/constants';

function Row({ label, value }) {
  return (
    <div className="sum-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export default function ConfirmationPage() {
  const router = useRouter();
  const settings = useSettings();
  const [booking, setBooking] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ref = getDraft().lastRef;
    const found = ref ? getBooking(ref) : null;
    if (!found) {
      router.replace('/reservation/format');
      return;
    }
    setBooking(found);
    setReady(true);
  }, [router]);

  if (!ready || !booking) {
    return (
      <div className="loading">
        <div className="spinner" />
        Chargement de votre confirmation…
      </div>
    );
  }

  const b = booking;
  const firstName = b.client.fullname.split(' ')[0];

  const waText = encodeURIComponent(
    [
      'Bonjour OCD Live, je viens de réserver un live.',
      `Référence : ${b.ref}`,
      `Format : ${modeLabel(b.mode)}`,
      `Date : ${formatDateFr(b.date)} à ${b.time}`,
      `Formule : ${b.pkg.name} (${b.pkg.duration})`,
      `Nom : ${b.client.fullname}`
    ].join('\n')
  );

  function downloadICS() {
    const [y, m, d] = b.date.split('-').map(Number);
    const [hh, mm] = b.time.split(':').map(Number);
    const start = new Date(y, m - 1, d, hh, mm);
    const end = new Date(start.getTime() + pkgHours(b.pkg) * 3600 * 1000);
    const fmt = (dt) =>
      `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//OCD Live//Reservation//FR',
      'BEGIN:VEVENT',
      `UID:${b.ref}@ocdlive`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:Live OCD Live — ${b.pkg.name}`,
      `LOCATION:${b.mode === 'presentiel' ? settings.address : 'Live à distance'}`,
      `DESCRIPTION:Réservation ${b.ref} — ${b.client.business}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocd-live-${b.ref}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function newBooking() {
    clearDraft();
    router.push('/reservation/format');
  }

  return (
    <div className="card confirm">
      <div className="confirm-icon">
        <Check size={34} />
      </div>
      <h2>C’est réservé, {firstName} !</h2>
      <p className="muted">
        Notre équipe a reçu votre demande et vous rappelle sous 24 h au {b.client.phone} pour
        confirmer.
      </p>

      <div className="ref">{b.ref}</div>

      <div className="confirm-recap">
        <Row label="Format" value={modeLabel(b.mode)} />
        <Row label="Date" value={formatDateFr(b.date)} />
        <Row label="Heure" value={b.time} />
        <Row label="Formule" value={`${b.pkg.name} · ${b.pkg.duration}`} />
        <Row label="Produits" value={`${b.products.length} produit(s) enregistré(s)`} />
        <Row
          label="Lieu"
          value={b.mode === 'presentiel' ? settings.address : 'Lien de connexion envoyé par WhatsApp'}
        />
        <div className="sum-total">
          <span>Total à régler</span>
          <b>{formatPrice(b.pkg.price)}</b>
        </div>
      </div>

      <div className="confirm-actions">
        <a
          className="btn btn-primary"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://wa.me/${settings.adminPhone}?text=${waText}`}
        >
          Confirmer sur WhatsApp
        </a>
        <button type="button" className="btn btn-ghost" onClick={downloadICS}>
          Ajouter à mon agenda
        </button>
        <button type="button" className="btn btn-ghost" onClick={newBooking}>
          Nouvelle réservation
        </button>
      </div>

      <div className="next-steps">
        <h3>La suite</h3>
        <ol>
          <li>Vous recevez un appel ou un message WhatsApp de l’équipe sous 24 h.</li>
          <li>Le paiement se règle à ce moment-là (Mobile Money, espèces ou virement).</li>
          {b.mode === 'presentiel' ? (
            <li>Le jour J, présentez-vous 20 minutes avant au {settings.address}.</li>
          ) : (
            <li>Un test technique est programmé la veille du direct.</li>
          )}
          <li>
            Gardez votre référence <b>{b.ref}</b> pour tout échange avec nous.
          </li>
        </ol>
        <p style={{ marginTop: 18 }}>
          <Link href="/" className="back-link">
            ← Revenir à l’accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
