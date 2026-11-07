'use client';

/* ============================================================
   ÉTAPE 4 / 5 — Formule et validation
   Dernière étape avant confirmation : le client choisit sa
   formule en ayant sous les yeux tout ce qu'il a déjà renseigné,
   puis valide. C'est ici que la réservation est créée.
   ============================================================ */

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PackageCard from '@/components/PackageCard';
import StepHead from '@/components/StepHead';
import StepNav from '@/components/StepNav';
import { useDraft, saveDraft, getDraft } from '@/lib/draft';
import { useSettings, addBooking, takenSlots } from '@/lib/store';
import { formatDateFr, formatPrice } from '@/lib/format';
import { modeLabel } from '@/lib/constants';

function RecapLine({ label, value, href }) {
  return (
    <div className="recap-line">
      <span className="recap-label">{label}</span>
      <span className="recap-value">{value}</span>
      {href && (
        <Link href={href} className="recap-edit">
          Modifier
        </Link>
      )}
    </div>
  );
}

export default function FormulePage() {
  const router = useRouter();
  const settings = useSettings();
  const { draft, ready, patch } = useDraft(
    ['mode', 'date', 'time', 'client', 'products'],
    '/reservation/informations'
  );

  const [pkgId, setPkgId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const packsRef = useRef(null);

  useEffect(() => {
    if (ready && draft.pkg) setPkgId(draft.pkg.id);
  }, [ready, draft.pkg]);

  if (!ready) {
    return (
      <div className="loading">
        <div className="spinner" />
        Chargement de votre réservation…
      </div>
    );
  }

  const packs = settings.packages[draft.mode] || [];
  const chosen = packs.find((p) => p.id === pkgId) || null;

  function handleSubmit(e) {
    e.preventDefault();

    if (!chosen) {
      setError('Choisissez une formule pour valider votre réservation.');
      packsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Le créneau a pu être pris pendant que le client remplissait le formulaire
    if (takenSlots(draft.date, draft.mode).includes(draft.time)) {
      setError('Ce créneau vient d’être réservé par quelqu’un d’autre. Choisissez-en un autre.');
      setTimeout(() => router.push('/reservation/date'), 1600);
      return;
    }

    setBusy(true);
    const pkg = {
      id: chosen.id,
      name: chosen.name,
      duration: chosen.duration,
      price: chosen.price
    };
    patch({ pkg });

    let booking;
    try {
      booking = addBooking({
        mode: draft.mode,
        date: draft.date,
        time: draft.time,
        pkg,
        client: draft.client,
        products: draft.products
      });
    } catch {
      setBusy(false);
      setError(
        'La mémoire du navigateur est pleine. Revenez à l’étape précédente pour retirer quelques photos, puis validez à nouveau.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    saveDraft({ ...getDraft(), pkg, lastRef: booking.ref });
    router.push('/reservation/confirmation');
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <StepHead
        step={4}
        title="Votre formule, et c’est validé"
        subtitle="Vérifiez votre réservation puis choisissez la durée qui vous convient. Aucun paiement n’est demandé sur ce site."
      />

      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}

      <div className="final-layout">
        {/* ---------- Choix de la formule ---------- */}
        <section className="form-block" ref={packsRef}>
          <div className="form-block-head">
            <h2>Choisissez votre formule</h2>
            <p>
              Tarifs {draft.mode === 'presentiel' ? 'du studio de Lomé' : 'pour un live à distance'}.
              Sans commission sur ce que vous vendez.
            </p>
          </div>

          <div className="pack-grid">
            {packs.map((pack) => (
              <PackageCard
                key={pack.id}
                pack={pack}
                selectable
                inputName="formule"
                selected={pkgId === pack.id}
                onSelect={(p) => {
                  setPkgId(p.id);
                  setError('');
                }}
              />
            ))}
          </div>

          <div className="bovan-note">
            <Image
              src="/promoteur.jpg"
              alt="Bovan, promoteur de OCD Live"
              width={56}
              height={56}
              style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top center' }}
            />
            <p>
              <b>Avec les formules Hebdo et Mensuel</b>, Bovan reposte lui-même vos produits sur ses
              comptes personnels et sur les pages OCD Live, en plus de vos directs. C’est la
              visibilité qui fait vendre, pas seulement le live.
            </p>
          </div>
        </section>

        {/* ---------- Récapitulatif ---------- */}
        <aside className="recap-card">
          <h2 className="recap-title">Votre réservation</h2>

          <RecapLine label="Format" value={modeLabel(draft.mode)} href="/reservation/format" />
          <RecapLine
            label="Date"
            value={`${formatDateFr(draft.date)} à ${draft.time}`}
            href="/reservation/date"
          />
          <RecapLine
            label="Lieu"
            value={draft.mode === 'presentiel' ? settings.address : 'En visio, lien envoyé par WhatsApp'}
          />

          <div className="recap-sep" />

          <RecapLine label="Nom" value={draft.client.fullname} href="/reservation/informations" />
          <RecapLine label="Téléphone" value={draft.client.phone} href="/reservation/informations" />
          <RecapLine
            label="Activité"
            value={`${draft.client.business} · ${draft.client.sector}`}
            href="/reservation/informations"
          />

          <div className="recap-sep" />

          <div className="recap-products">
            <div className="recap-line">
              <span className="recap-label">Produits ({draft.products.length})</span>
              <Link href="/reservation/informations" className="recap-edit">
                Modifier
              </Link>
            </div>
            <ul>
              {draft.products.map((p, i) => (
                <li key={`${p.name}-${i}`}>
                  {p.images?.length > 0 && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img className="recap-thumb" src={p.images[0]} alt="" />
                  )}
                  <span>
                    {p.name}
                    {p.images?.length > 1 && (
                      <em className="recap-photo-count">+{p.images.length - 1} photo(s)</em>
                    )}
                  </span>
                  <b>{p.price ? formatPrice(p.price) : 'à préciser'}</b>
                </li>
              ))}
            </ul>
          </div>

          <div className="recap-total">
            <div>
              <span>Total à régler</span>
              <em>{chosen ? chosen.name : 'Aucune formule choisie'}</em>
            </div>
            <b>{chosen ? formatPrice(chosen.price) : '—'}</b>
          </div>

          <p className="recap-note">
            Rien n’est prélevé maintenant. L’équipe vous rappelle sous 24 h pour confirmer le
            créneau et convenir du règlement.
          </p>
        </aside>
      </div>

      <StepNav
        backHref="/reservation/informations"
        backLabel="Mes informations"
        submitLabel="Confirmer ma réservation"
        disabled={!chosen}
        busy={busy}
        hint={chosen ? 'Total : ' : 'Choisissez une formule'}
        hintStrong={chosen ? formatPrice(chosen.price) : null}
      />
    </form>
  );
}
