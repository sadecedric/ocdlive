'use client';

import { useEffect, useState } from 'react';
import { Close } from '@/components/Icons';
import { toast } from '@/components/Toast';
import { getBooking, updateBooking, deleteBooking, buildAdminMessage, useSettings } from '@/lib/store';
import { STATUS_LABEL } from '@/lib/constants';
import { formatDateFr, formatPrice } from '@/lib/format';

function Line({ label, value }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </>
  );
}

export default function BookingModal({ refId, onClose }) {
  const settings = useSettings();
  const [booking, setBooking] = useState(null);
  const [zoom, setZoom] = useState(null);
  const openPhoto = (src) => setZoom(src);

  useEffect(() => {
    setBooking(getBooking(refId));
  }, [refId]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      // Échap ferme d'abord la photo agrandie, puis la fiche
      if (zoom) setZoom(null);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, zoom]);

  if (!booking) return null;
  const b = booking;
  const recap = buildAdminMessage(b);

  function changeStatus(value) {
    updateBooking(b.ref, { status: value });
    setBooking({ ...b, status: value });
    toast('Statut mis à jour.');
  }

  function copyRecap() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(recap).then(() => toast('Récapitulatif copié.'));
    } else {
      toast('Copie non disponible sur ce navigateur.');
    }
  }

  function remove() {
    if (!window.confirm(`Supprimer définitivement la réservation ${b.ref} ?`)) return;
    deleteBooking(b.ref);
    toast('Réservation supprimée.');
    onClose();
  }

  const waHref =
    `https://wa.me/${b.client.phone.replace(/\D/g, '')}?text=` +
    encodeURIComponent(
      `Bonjour ${b.client.fullname}, ici OCD Live. Nous confirmons votre live du ${formatDateFr(b.date)} à ${b.time} (réf. ${b.ref}).`
    );

  const mailHref =
    `mailto:${b.client.email || ''}` +
    `?subject=${encodeURIComponent(`OCD Live — réservation ${b.ref}`)}` +
    `&body=${encodeURIComponent(recap)}`;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={`Réservation ${b.ref}`}>
        <div className="modal-head">
          <div>
            <h2 style={{ fontSize: '1.3rem' }}>{b.ref}</h2>
            <span className={`badge ${b.status}`} style={{ marginTop: 8, display: 'inline-block' }}>
              {STATUS_LABEL[b.status]}
            </span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
            <Close />
          </button>
        </div>

        <div className="modal-body">
          <dl className="detail-grid">
            <Line
              label="Format"
              value={b.mode === 'presentiel' ? `Présentiel — ${settings.address}` : 'À distance'}
            />
            <Line label="Date" value={`${formatDateFr(b.date)} à ${b.time}`} />
            <Line label="Formule" value={`${b.pkg.name} · ${b.pkg.duration}`} />
            <Line label="Montant" value={formatPrice(b.pkg.price)} />
            <Line label="Paiement" value={b.client.payment} />
          </dl>

          <h4>Client</h4>
          <dl className="detail-grid">
            <Line label="Nom" value={b.client.fullname} />
            <Line label="Téléphone" value={b.client.phone} />
            <Line label="E-mail" value={b.client.email} />
            <Line label="Activité" value={`${b.client.business} (${b.client.sector})`} />
            <Line label="Ville" value={b.client.city} />
            <Line label="Origine" value={b.client.heard} />
          </dl>

          <h4>Produits à présenter ({b.products.length})</h4>
          <ul className="prod-list">
            {b.products.map((p, i) => (
              <li key={`${p.name}-${i}`} className="prod-item">
                <div className="prod-item-row">
                  <span>
                    {p.name}
                    {p.note && <span className="sub">{p.note}</span>}
                  </span>
                  <b>{p.price ? formatPrice(p.price) : 'à préciser'}</b>
                </div>

                {p.images?.length > 0 && (
                  <div className="prod-photos">
                    {p.images.map((src, k) => (
                      <button
                        key={`${i}-${k}`}
                        type="button"
                        className="prod-photo"
                        title="Ouvrir la photo en grand"
                        onClick={() => openPhoto(src)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`${p.name}, vue ${k + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {b.client.notes && (
            <>
              <h4>Note du client</h4>
              <p style={{ fontSize: '.9rem', color: 'var(--ink-2)' }}>{b.client.notes}</p>
            </>
          )}

          <h4>Statut</h4>
          <select value={b.status} onChange={(e) => changeStatus(e.target.value)}>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost btn-sm" onClick={remove}>
            Supprimer
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={copyRecap}>
            Copier le récapitulatif
          </button>
          <a className="btn btn-ghost btn-sm" href={mailHref}>
            Envoyer par e-mail
          </a>
          <a className="btn btn-primary btn-sm" href={waHref} target="_blank" rel="noopener noreferrer">
            Écrire au client
          </a>
        </div>
      </div>

      {/* Photo en grand */}
      {zoom && (
        <button
          type="button"
          className="photo-zoom"
          aria-label="Fermer la photo"
          onClick={(e) => {
            e.stopPropagation();
            setZoom(null);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="Produit du client, en grand" />
        </button>
      )}
    </div>
  );
}
