'use client';

/* ============================================================
   ÉTAPE 3 / 5 — Vos informations et vos produits
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import StepHead from '@/components/StepHead';
import StepNav from '@/components/StepNav';
import { Trash, Close } from '@/components/Icons';
import { toast } from '@/components/Toast';
import { useDraft } from '@/lib/draft';
import { SECTORS, PAYMENTS, SOURCES } from '@/lib/constants';
import { formatDateFr } from '@/lib/format';
import {
  compressImage, countPhotos, ImageError,
  MAX_PHOTOS_PER_PRODUCT, MAX_PHOTOS_PER_BOOKING
} from '@/lib/image';

const EMPTY_PRODUCT = { name: '', price: '', note: '', images: [] };
const MAX_PRODUCTS = 15;

const EMPTY_FORM = {
  fullname: '', phone: '', email: '', city: '',
  business: '', sector: '',
  payment: PAYMENTS[0], heard: '', notes: ''
};

export default function InformationsPage() {
  const router = useRouter();
  const { draft, ready, patch } = useDraft(['mode', 'date', 'time'], '/reservation/date');

  const [form, setForm] = useState(EMPTY_FORM);
  const [products, setProducts] = useState([{ ...EMPTY_PRODUCT }]);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState('');
  const [uploading, setUploading] = useState(0);
  const alertRef = useRef(null);
  const lastProductRef = useRef(null);
  const shouldFocusProduct = useRef(false);

  // reprise des informations déjà saisies
  useEffect(() => {
    if (!ready) return;
    if (draft.client) setForm({ ...EMPTY_FORM, ...draft.client });
    if (draft.products?.length) setProducts(draft.products.map((p) => ({ ...EMPTY_PRODUCT, ...p })));
  }, [ready, draft.client, draft.products]);

  useEffect(() => {
    if (shouldFocusProduct.current && lastProductRef.current) {
      lastProductRef.current.focus();
      shouldFocusProduct.current = false;
    }
  }, [products.length]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  /* --- validation champ par champ, déclenchée à la sortie du champ --- */
  function checkField(field, value) {
    switch (field) {
      case 'fullname':
        return value.trim() ? null : 'Indiquez votre nom.';
      case 'phone':
        return value.replace(/\D/g, '').length >= 8 ? null : 'Numéro trop court (8 chiffres minimum).';
      case 'business':
        return value.trim() ? null : 'Indiquez le nom de votre activité.';
      case 'sector':
        return value ? null : 'Choisissez un type de business.';
      case 'email':
        if (!value.trim()) return null;
        return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim()) ? null : 'Cet e-mail ne semble pas valide.';
      default:
        return null;
    }
  }

  const blur = (field) => (e) =>
    setErrors((prev) => ({ ...prev, [field]: checkField(field, e.target.value) }));

  function setProduct(index, field, value) {
    setProducts((list) => list.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
    if (errors.products) setErrors((prev) => ({ ...prev, products: null }));
  }

  function addProduct() {
    if (products.length >= MAX_PRODUCTS) {
      toast(`${MAX_PRODUCTS} produits au maximum par live.`);
      return;
    }
    shouldFocusProduct.current = true;
    setProducts((list) => [...list, { ...EMPTY_PRODUCT }]);
  }

  function removeProduct(index) {
    if (products.length === 1) {
      setProducts([{ ...EMPTY_PRODUCT }]);
      toast('Au moins un produit est nécessaire.');
      return;
    }
    setProducts((list) => list.filter((_, i) => i !== index));
  }

  /* ---------------- Photos des produits ---------------- */
  async function addPhotos(index, fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const current = products[index].images || [];
    const roomInProduct = MAX_PHOTOS_PER_PRODUCT - current.length;
    const roomInBooking = MAX_PHOTOS_PER_BOOKING - countPhotos(products);

    if (roomInProduct <= 0) {
      toast(`${MAX_PHOTOS_PER_PRODUCT} photos maximum par produit.`);
      return;
    }
    if (roomInBooking <= 0) {
      toast(`${MAX_PHOTOS_PER_BOOKING} photos maximum pour une réservation.`);
      return;
    }

    const accepted = files.slice(0, Math.min(roomInProduct, roomInBooking));
    const ignored = files.length - accepted.length;

    setUploading((n) => n + 1);
    try {
      const results = [];
      for (const file of accepted) {
        try {
          results.push(await compressImage(file));
        } catch (err) {
          toast(err instanceof ImageError ? err.message : 'Image illisible, ignorée.');
        }
      }
      if (results.length) {
        setProducts((list) =>
          list.map((p, i) => (i === index ? { ...p, images: [...(p.images || []), ...results] } : p))
        );
      }
      if (ignored > 0) {
        toast(`${ignored} photo(s) non ajoutée(s) : limite atteinte.`);
      }
    } finally {
      setUploading((n) => n - 1);
    }
  }

  function removePhoto(index, photoIndex) {
    setProducts((list) =>
      list.map((p, i) =>
        i === index ? { ...p, images: p.images.filter((_, k) => k !== photoIndex) } : p
      )
    );
  }

  function handleSubmit(e) {
    e.preventDefault();

    const next = {};
    ['fullname', 'phone', 'business', 'sector', 'email'].forEach((field) => {
      const msg = checkField(field, form[field]);
      if (msg) next[field] = msg;
    });

    const kept = products.filter((p) => p.name.trim());
    if (!kept.length) next.products = 'Ajoutez au moins un produit à présenter.';

    setErrors(next);

    if (Object.keys(next).length) {
      setAlert(
        next.products && Object.keys(next).length === 1
          ? 'Ajoutez au moins un produit à présenter pendant le live.'
          : 'Quelques champs sont à compléter avant de continuer.'
      );
      requestAnimationFrame(() => {
        const firstInvalid = document.querySelector('.invalid');
        if (firstInvalid) firstInvalid.focus({ preventScroll: true });
        (alertRef.current || firstInvalid)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    setAlert('');
    const saved = patch({
      client: {
        fullname: form.fullname.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        business: form.business.trim(),
        sector: form.sector,
        payment: form.payment,
        heard: form.heard,
        notes: form.notes.trim()
      },
      products: kept.map((p) => ({
        name: p.name.trim(),
        price: String(p.price).trim(),
        note: p.note.trim(),
        images: p.images || []
      }))
    });

    if (!saved) {
      setAlert(
        'La mémoire du navigateur est pleine. Retirez quelques photos, puis réessayez.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    router.push('/reservation/formule');
  }

  if (!ready) {
    return (
      <div className="loading">
        <div className="spinner" />
        Chargement de votre réservation…
      </div>
    );
  }

  const filledProducts = products.filter((p) => p.name.trim()).length;
  const photoCount = countPhotos(products);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <StepHead
        step={3}
        title="Vos informations et vos produits"
        subtitle={`Pour votre live du ${formatDateFr(draft.date)} à ${draft.time}. Ces informations sont annoncées à l’antenne et préparées à l’écran par l’équipe.`}
      />

      {alert && (
        <div className="form-alert" role="alert" ref={alertRef}>
          {alert}
        </div>
      )}

      {/* ---------- Identité ---------- */}
      <section className="form-block">
        <div className="form-block-head">
          <h2>Vos coordonnées</h2>
          <p>Votre numéro est affiché pendant le live pour que les clients vous contactent.</p>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="fullname">
              Nom et prénom <span className="req">*</span>
            </label>
            <input
              id="fullname" type="text" autoComplete="name" placeholder="Afi Koffi"
              className={errors.fullname ? 'invalid' : ''}
              aria-invalid={Boolean(errors.fullname)}
              value={form.fullname} onChange={set('fullname')} onBlur={blur('fullname')}
            />
            {errors.fullname && <span className="field-error show">{errors.fullname}</span>}
          </div>

          <div className="field">
            <label htmlFor="phone">
              Téléphone / WhatsApp <span className="req">*</span>
            </label>
            <input
              id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+228 90 12 34 56"
              className={errors.phone ? 'invalid' : ''}
              aria-invalid={Boolean(errors.phone)}
              value={form.phone} onChange={set('phone')} onBlur={blur('phone')}
            />
            {errors.phone ? (
              <span className="field-error show">{errors.phone}</span>
            ) : (
              <span className="field-help">C’est ce numéro que les clients verront à l’écran.</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="email">E-mail <span className="opt">facultatif</span></label>
            <input
              id="email" type="email" inputMode="email" autoComplete="email" placeholder="vous@exemple.com"
              className={errors.email ? 'invalid' : ''}
              aria-invalid={Boolean(errors.email)}
              value={form.email} onChange={set('email')} onBlur={blur('email')}
            />
            {errors.email && <span className="field-error show">{errors.email}</span>}
          </div>

          <div className="field">
            <label htmlFor="city">Ville</label>
            <input
              id="city" type="text" autoComplete="address-level2" placeholder="Lomé"
              value={form.city} onChange={set('city')}
            />
          </div>
        </div>
      </section>

      {/* ---------- Activité ---------- */}
      <section className="form-block">
        <div className="form-block-head">
          <h2>Votre activité</h2>
          <p>Le nom annoncé pendant le direct et affiché sur nos pages.</p>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="business">
              Nom de votre activité <span className="req">*</span>
            </label>
            <input
              id="business" type="text" placeholder="Afi Collection"
              className={errors.business ? 'invalid' : ''}
              aria-invalid={Boolean(errors.business)}
              value={form.business} onChange={set('business')} onBlur={blur('business')}
            />
            {errors.business && <span className="field-error show">{errors.business}</span>}
          </div>

          <div className="field">
            <label htmlFor="sector">
              Type de business <span className="req">*</span>
            </label>
            <select
              id="sector" className={errors.sector ? 'invalid' : ''}
              aria-invalid={Boolean(errors.sector)}
              value={form.sector} onChange={set('sector')} onBlur={blur('sector')}
            >
              <option value="">Choisir…</option>
              {SECTORS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {errors.sector && <span className="field-error show">{errors.sector}</span>}
          </div>
        </div>
      </section>

      {/* ---------- Produits ---------- */}
      <section className="form-block">
        <div className="form-block-head">
          <h2>
            Les produits à présenter
            <span className="count-pill">{filledProducts}</span>
          </h2>
          <p>
            Le cœur du live. Nom et prix sont affichés à l’écran pendant que vous présentez.
            Ajoutez des photos : elles servent à préparer le plateau et l’habillage du direct.
            Vous pourrez compléter la liste jusqu’à 24 h avant le live.
          </p>
        </div>

        {errors.products && (
          <div className="form-alert soft" role="alert">
            {errors.products}
          </div>
        )}

        <div className="product-list">
          {products.map((p, i) => (
            <div className="product-item" key={i}>
              <div className="product-item-head">
                <span className="product-num">Produit {i + 1}</span>
                <button
                  type="button" className="icon-btn" title="Retirer ce produit"
                  aria-label={`Retirer le produit ${i + 1}`}
                  onClick={() => removeProduct(i)}
                >
                  <Trash />
                </button>
              </div>

              <div className="product-fields">
                <div className="field product-name">
                  <label htmlFor={`p-name-${i}`}>Nom du produit <span className="req">*</span></label>
                  <input
                    id={`p-name-${i}`} type="text" placeholder="Robe pagne cérémonie"
                    ref={i === products.length - 1 ? lastProductRef : null}
                    value={p.name} onChange={(e) => setProduct(i, 'name', e.target.value)}
                  />
                </div>
                <div className="field product-price">
                  <label htmlFor={`p-price-${i}`}>Prix (FCFA)</label>
                  <input
                    id={`p-price-${i}`} type="number" inputMode="numeric" min="0" step="100" placeholder="18 000"
                    value={p.price} onChange={(e) => setProduct(i, 'price', e.target.value)}
                  />
                </div>
                <div className="field product-note">
                  <label htmlFor={`p-note-${i}`}>Détail <span className="opt">facultatif</span></label>
                  <input
                    id={`p-note-${i}`} type="text" placeholder="Tailles 38 à 44, 3 coloris"
                    value={p.note} onChange={(e) => setProduct(i, 'note', e.target.value)}
                  />
                </div>
              </div>

              {/* ---- Photos du produit ---- */}
              <div className="photo-block">
                <span className="photo-label">
                  Photos <span className="opt">facultatif — {MAX_PHOTOS_PER_PRODUCT} max</span>
                </span>

                <div className="photo-row">
                  {(p.images || []).map((src, k) => (
                    <div className="photo-thumb" key={src.slice(-32) + k}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Photo ${k + 1} de ${p.name || `produit ${i + 1}`}`} />
                      <button
                        type="button"
                        aria-label={`Retirer la photo ${k + 1}`}
                        onClick={() => removePhoto(i, k)}
                      >
                        <Close size={12} />
                      </button>
                    </div>
                  ))}

                  {(p.images || []).length < MAX_PHOTOS_PER_PRODUCT && (
                    <label className="photo-add">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          addPhotos(i, e.target.files);
                          e.target.value = '';
                        }}
                      />
                      <span aria-hidden="true">+</span>
                      <em>Ajouter</em>
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="btn btn-ghost add-product" onClick={addProduct}>
          + Ajouter un produit
        </button>
      </section>

      {/* ---------- Détails ---------- */}
      <section className="form-block">
        <div className="form-block-head">
          <h2>Derniers détails</h2>
          <p>Pour que l’équipe prépare le plateau et le matériel.</p>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="payment">Moyen de paiement prévu</label>
            <select id="payment" value={form.payment} onChange={set('payment')}>
              {PAYMENTS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <span className="field-help">Rien n’est prélevé ici : le règlement se fait avec l’équipe.</span>
          </div>

          <div className="field">
            <label htmlFor="heard">Comment nous avez-vous connus ?</label>
            <select id="heard" value={form.heard} onChange={set('heard')}>
              <option value="">Choisir…</option>
              {SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="field full">
            <label htmlFor="notes">Un besoin particulier ? <span className="opt">facultatif</span></label>
            <textarea
              id="notes" rows={3} value={form.notes} onChange={set('notes')}
              placeholder="J’ai besoin d’un portant pour les vêtements, je viendrai avec un mannequin…"
            />
          </div>
        </div>
      </section>

      <StepNav
        backHref="/reservation/date"
        backLabel="Date"
        submitLabel="Voir les formules"
        busy={uploading > 0}
        hint={
          filledProducts
            ? `${filledProducts} produit${filledProducts > 1 ? 's' : ''}${
                photoCount ? ` · ${photoCount} photo${photoCount > 1 ? 's' : ''}` : ''
              }`
            : null
        }
      />
    </form>
  );
}
