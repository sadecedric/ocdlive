'use client';

import { useEffect, useState } from 'react';
import { toast } from '@/components/Toast';
import {
  useSettings, getSettings, saveSettings,
  addBooking, updateBooking, slotsFor, KEYS, remove
} from '@/lib/store';
import { toISODate } from '@/lib/format';

const DEMO = [
  ['Afi Koffi', 'Afi Collection', 'Mode et prêt-à-porter', '+228 90 11 22 33',
    [['Robe pagne cérémonie', '18000', 'Tailles 38 à 44'], ['Ensemble wax 2 pièces', '25000', '3 coloris']]],
  ['Kossi Mensah', 'KM Électronique', 'Électronique et téléphonie', '+228 91 44 55 66',
    [['Smartphone reconditionné', '85000', 'Garantie 3 mois'], ['Écouteurs sans fil', '9000', '']]],
  ['Adjo Agbeko', 'Adjo Beauté', 'Cosmétiques et soins', '+228 92 77 88 99',
    [['Sérum éclaircissant', '12000', 'Flacon 50 ml'], ['Beurre de karité pur', '3500', 'Pot 250 g']]],
  ['Yao Dossou', 'Dossou Sneakers', 'Chaussures et maroquinerie', '+228 93 10 20 30',
    [['Baskets homme', '22000', 'Pointures 40 à 45'], ['Sandales cuir', '15000', '']]],
  ['Esi Amegan', 'Esi Hair', 'Cheveux et perruques', '+228 70 40 50 60',
    [['Perruque lace frontal', '45000', 'Cheveux naturels'], ['Mèches brésiliennes', '30000', 'Lot de 3']]]
];

const DEMO_STATUS = ['nouveau', 'confirme', 'termine', 'nouveau', 'confirme'];

export default function SettingsTab() {
  const settings = useSettings();
  const [form, setForm] = useState({ adminEmail: '', adminPhone: '', address: '', adminCode: '' });
  const [prices, setPrices] = useState({});

  useEffect(() => {
    setForm({
      adminEmail: settings.adminEmail,
      adminPhone: settings.adminPhone,
      address: settings.address,
      adminCode: settings.adminCode
    });
    const next = {};
    ['presentiel', 'distance'].forEach((mode) => {
      settings.packages[mode].forEach((p) => {
        next[`${mode}:${p.id}`] = p.price;
      });
    });
    setPrices(next);
  }, [settings]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function saveContact() {
    const current = getSettings();
    saveSettings({
      ...current,
      adminEmail: form.adminEmail.trim(),
      adminPhone: form.adminPhone.replace(/\D/g, ''),
      address: form.address.trim(),
      adminCode: form.adminCode.trim() || current.adminCode
    });
    toast('Paramètres enregistrés.');
  }

  function savePrices() {
    const current = getSettings();
    const packages = { presentiel: [], distance: [] };
    ['presentiel', 'distance'].forEach((mode) => {
      packages[mode] = current.packages[mode].map((p) => ({
        ...p,
        price: Number(prices[`${mode}:${p.id}`]) || p.price
      }));
    });
    saveSettings({ ...current, packages });
    toast('Tarifs mis à jour sur le site.');
  }

  function seed() {
    const current = getSettings();
    DEMO.forEach((entry, i) => {
      const [fullname, business, sector, phone, produits] = entry;
      const mode = i % 2 === 0 ? 'presentiel' : 'distance';
      const slots = slotsFor(current, mode);
      const packs = current.packages[mode];
      const pack = packs[i % packs.length];
      const day = new Date();
      day.setDate(day.getDate() + (i + 1) * 2);

      const booking = addBooking({
        mode,
        date: toISODate(day),
        time: slots[i % slots.length],
        pkg: { id: pack.id, name: pack.name, duration: pack.duration, price: pack.price },
        client: {
          fullname, phone, email: '', city: 'Lomé', business, sector,
          payment: 'Mobile Money (Mixx by Yas / Flooz)', heard: 'TikTok', notes: ''
        },
        products: produits.map(([name, price, note]) => ({ name, price, note }))
      });
      updateBooking(booking.ref, { status: DEMO_STATUS[i] });
    });
    toast('5 réservations de démonstration ajoutées.');
  }

  function wipe() {
    if (!window.confirm('Effacer toutes les réservations, notifications et dates fermées ?')) return;
    remove(KEYS.bookings);
    remove(KEYS.notifs);
    remove(KEYS.blocked);
    toast('Données effacées.');
  }

  function priceRows(mode) {
    return settings.packages[mode].map((p) => (
      <div className="price-row" key={p.id}>
        <span>
          {p.name}
          <em>{p.duration}</em>
        </span>
        <input
          type="number" min="0" step="500"
          value={prices[`${mode}:${p.id}`] ?? p.price}
          onChange={(e) => setPrices((prev) => ({ ...prev, [`${mode}:${p.id}`]: e.target.value }))}
        />
      </div>
    ));
  }

  const subhead = {
    fontSize: '.78rem',
    textTransform: 'uppercase',
    letterSpacing: '.1em',
    color: 'var(--muted)'
  };

  return (
    <section className="settings-grid">
      <div className="card form-card">
        <h3>Coordonnées de l’équipe</h3>
        <p className="hint">Utilisées pour les notifications et les boutons de contact du site.</p>

        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="set-email">E-mail qui reçoit les réservations</label>
          <input id="set-email" type="email" value={form.adminEmail} onChange={set('adminEmail')} />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="set-phone">WhatsApp (format international, sans +)</label>
          <input id="set-phone" type="text" placeholder="22890000000" value={form.adminPhone} onChange={set('adminPhone')} />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="set-address">Adresse du studio</label>
          <input id="set-address" type="text" value={form.address} onChange={set('address')} />
        </div>
        <div className="field" style={{ marginBottom: 18 }}>
          <label htmlFor="set-code">Code d’accès de cet espace</label>
          <input id="set-code" type="text" value={form.adminCode} onChange={set('adminCode')} />
        </div>

        <button type="button" className="btn btn-primary btn-block" onClick={saveContact}>
          Enregistrer
        </button>
      </div>

      <div>
        <div className="card form-card">
          <h3>Tarifs</h3>
          <p className="hint">
            Modifiables sans toucher au code : le site public se met à jour aussitôt.
          </p>
          <h4 style={{ ...subhead, margin: '10px 0' }}>Présentiel</h4>
          {priceRows('presentiel')}
          <h4 style={{ ...subhead, margin: '18px 0 10px' }}>À distance</h4>
          {priceRows('distance')}
          <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={savePrices}>
            Enregistrer les tarifs
          </button>
        </div>

        <div className="card form-card">
          <h3>Données de démonstration</h3>
          <p className="hint">Utile pour présenter le site avec un agenda déjà rempli.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={seed}>
              Générer 5 réservations
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={wipe}>
              Tout effacer
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
