'use client';

/* ============================================================
   OCD LIVE — Couche de données
   ------------------------------------------------------------
   Prototype : les données vivent dans le localStorage du
   navigateur. Pour passer en production, il suffit de remplacer
   le corps des fonctions marquées [API] par des appels HTTP
   vers une vraie base (Vercel Postgres, Supabase, Firebase…).
   Le reste de l'application n'a pas à être modifié.
   ============================================================ */

import { useEffect, useState, useCallback } from 'react';
import { DEFAULT_SETTINGS } from './constants';
import { formatDateFr, formatPrice, toISODate } from './format';

export const KEYS = {
  bookings: 'ocd_bookings',
  notifs: 'ocd_notifications',
  blocked: 'ocd_blocked_dates',
  settings: 'ocd_settings',
  draft: 'ocd_draft'
};

const CHANGE_EVENT = 'ocd:change';

/* ---------------- Accès bas niveau ---------------- */
export function read(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
  } catch {
    /* stockage indisponible */
  }
}

/** S'abonne aux changements, y compris ceux venant d'un autre onglet. */
export function onChange(handler) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

/* ---------------- Réglages ---------------- */
export function getSettings() {
  const saved = read(KEYS.settings, null);
  return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
}

export const saveSettings = (s) => write(KEYS.settings, s);

/**
 * Renvoie les réglages par défaut au premier rendu (identique côté serveur),
 * puis la version enregistrée dès que le navigateur a pris la main.
 * Évite toute erreur d'hydratation.
 */
export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const refresh = useCallback(() => setSettings(getSettings()), []);
  useEffect(() => {
    refresh();
    return onChange(refresh);
  }, [refresh]);
  return settings;
}

/* ---------------- Réservations ---------------- */
export const getBookings = () => read(KEYS.bookings, []);
const saveBookings = (list) => write(KEYS.bookings, list);

function makeRef() {
  const y = String(new Date().getFullYear()).slice(-2);
  const n = Math.floor(1000 + Math.random() * 9000);
  return `OCD-${y}-${n}`;
}

/** Stockage du navigateur plein : surtout possible avec des photos. */
export class StorageFullError extends Error {
  constructor() {
    super('Stockage du navigateur saturé.');
    this.name = 'StorageFullError';
  }
}

/** [API] -> POST /bookings */
export function addBooking(data) {
  const booking = {
    ref: makeRef(),
    createdAt: new Date().toISOString(),
    status: 'nouveau',
    mode: data.mode,
    date: data.date,
    time: data.time,
    pkg: data.pkg,
    client: data.client,
    products: data.products
  };

  if (!saveBookings([...getBookings(), booking])) {
    throw new StorageFullError();
  }

  pushNotification(booking);
  notifyAdmin(booking);
  return booking;
}

/** [API] -> PATCH /bookings/:ref */
export function updateBooking(ref, patch) {
  const list = getBookings().map((b) => (b.ref === ref ? { ...b, ...patch } : b));
  saveBookings(list);
  return list.find((b) => b.ref === ref) || null;
}

/** [API] -> DELETE /bookings/:ref */
export function deleteBooking(ref) {
  saveBookings(getBookings().filter((b) => b.ref !== ref));
}

export function getBooking(ref) {
  return getBookings().find((b) => b.ref === ref) || null;
}

/** Liste réactive, utilisée par le tableau de bord. */
export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [ready, setReady] = useState(false);
  const refresh = useCallback(() => {
    setBookings(getBookings());
    setReady(true);
  }, []);
  useEffect(() => {
    refresh();
    return onChange(refresh);
  }, [refresh]);
  return { bookings, ready, refresh };
}

/* ---------------- Disponibilités ---------------- */
export const getBlockedDates = () => read(KEYS.blocked, []);

export function toggleBlockedDate(iso) {
  const list = getBlockedDates();
  const next = list.includes(iso) ? list.filter((d) => d !== iso) : [...list, iso];
  write(KEYS.blocked, next);
  return next;
}

export const slotsFor = (settings, mode) =>
  mode === 'presentiel' ? settings.slotsPresentiel : settings.slotsDistance;

export const closedWeekdays = (settings, mode) =>
  mode === 'presentiel' ? settings.closedWeekdaysPresentiel : settings.closedWeekdaysDistance;

export function takenSlots(iso, mode) {
  return getBookings()
    .filter((b) => b.date === iso && b.mode === mode && b.status !== 'annule')
    .map((b) => b.time);
}

/** Un créneau du jour même se ferme 2 h avant son début. */
export function isPastSlot(iso, time) {
  const now = new Date();
  if (iso !== toISODate(now)) return false;
  const [h, m] = time.split(':').map(Number);
  const slot = new Date();
  slot.setHours(h, m, 0, 0);
  return slot.getTime() - now.getTime() < 2 * 3600 * 1000;
}

/* ---------------- Notifications internes ---------------- */
export const getNotifications = () => read(KEYS.notifs, []);

function pushNotification(b) {
  const list = getNotifications();
  const entry = {
    id: 'n' + Date.now(),
    ref: b.ref,
    read: false,
    createdAt: b.createdAt,
    title: `Nouvelle réservation ${b.ref}`,
    body: `${b.client.fullname} a réservé un live ${
      b.mode === 'presentiel' ? 'en présentiel (Lomé)' : 'à distance'
    } le ${formatDateFr(b.date)} à ${b.time}.`
  };
  write(KEYS.notifs, [entry, ...list].slice(0, 100));
}

export function markAllRead() {
  write(KEYS.notifs, getNotifications().map((n) => ({ ...n, read: true })));
}

export function useNotifications() {
  const [notifs, setNotifs] = useState([]);
  const refresh = useCallback(() => setNotifs(getNotifications()), []);
  useEffect(() => {
    refresh();
    return onChange(refresh);
  }, [refresh]);
  return { notifs, unread: notifs.filter((n) => !n.read).length, refresh };
}

/* ---------------- Notification de l'équipe ---------------- */
/**
 * Envoie le récapitulatif à l'API interne. Si les variables
 * RESEND_API_KEY et NOTIFY_EMAIL sont configurées sur Vercel,
 * un e-mail réel part vers l'équipe ; sinon l'appel ne fait rien
 * de visible et la notification reste consultable dans /admin.
 */
export function notifyAdmin(booking) {
  const settings = getSettings();
  const payload = {
    to: settings.adminEmail,
    subject: `OCD Live — nouvelle réservation ${booking.ref}`,
    message: buildAdminMessage(booking),
    booking
  };
  try {
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch {
    /* hors ligne : la notification interne suffit */
  }
  return payload;
}

export function buildAdminMessage(b) {
  const l = [];
  l.push(`NOUVELLE RÉSERVATION — ${b.ref}`);
  l.push('');
  l.push(`Format    : ${b.mode === 'presentiel' ? 'Présentiel — Lomé (Togo)' : 'À distance'}`);
  l.push(`Date      : ${formatDateFr(b.date)} à ${b.time}`);
  l.push(`Formule   : ${b.pkg.name} (${b.pkg.duration}) — ${formatPrice(b.pkg.price)}`);
  l.push('');
  l.push(`Client    : ${b.client.fullname}`);
  l.push(`Téléphone : ${b.client.phone}`);
  if (b.client.email) l.push(`E-mail    : ${b.client.email}`);
  l.push(`Activité  : ${b.client.business} (${b.client.sector})`);
  if (b.client.city) l.push(`Ville     : ${b.client.city}`);
  l.push(`Paiement  : ${b.client.payment || 'non précisé'}`);
  l.push('');
  l.push('PRODUITS À PRÉSENTER :');
  b.products.forEach((p, i) => {
    l.push(`  ${i + 1}. ${p.name} — ${p.price ? formatPrice(p.price) : 'prix à préciser'}${p.note ? ' — ' + p.note : ''}`);
  });
  if (b.client.notes) {
    l.push('');
    l.push(`Note du client : ${b.client.notes}`);
  }
  return l.join('\n');
}
