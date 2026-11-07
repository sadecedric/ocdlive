import { MOIS, JOURS } from './constants';

export const pad = (n) => (n < 10 ? '0' + n : String(n));

export const toISODate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function formatDateFr(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]} ${y}`;
}

export function formatDateShort(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).split('-');
  return `${d}/${m}/${y}`;
}

/* Espace fine insécable évitée : on reste sur un espace simple,
   identique côté serveur et côté navigateur (pas de décalage d'hydratation). */
export function formatPrice(n) {
  return String(Number(n) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export const pkgHours = (pkg) => (pkg && /2\s*heures/i.test(pkg.duration) ? 2 : 1);

export const isSubscription = (pkg) => Boolean(pkg && /lives/i.test(pkg.duration));
