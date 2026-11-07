'use client';

/* ============================================================
   OCD LIVE — Brouillon de réservation
   ------------------------------------------------------------
   Chaque étape du tunnel est une page distincte. Le brouillon
   assure la continuité d'une page à l'autre : il est relu à
   chaque arrivée et complété à chaque validation de formulaire.
   ============================================================ */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { KEYS, read, write, remove } from './store';

const EMPTY = { mode: null, date: null, time: null, pkg: null, client: null, products: null };

export const getDraft = () => ({ ...EMPTY, ...read(KEYS.draft, {}) });
export const saveDraft = (d) => write(KEYS.draft, d);
export const clearDraft = () => remove(KEYS.draft);

/**
 * @param {string[]} required  champs qui doivent déjà être remplis
 * @param {string}   fallback  page vers laquelle renvoyer s'il en manque un
 */
export function useDraft(required = [], fallback = '/reservation/format') {
  const router = useRouter();
  const [draft, setDraft] = useState(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = getDraft();
    const missing = required.find((field) => !current[field]);
    if (missing) {
      router.replace(fallback);
      return;
    }
    setDraft(current);
    setReady(true);
    // les dépendances sont volontairement figées : le garde-fou
    // ne doit s'exécuter qu'à l'arrivée sur la page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Renvoie le brouillon mis à jour, ou null si l'enregistrement a échoué
      (stockage du navigateur plein — typiquement trop de photos). */
  const patch = useCallback((changes) => {
    const next = { ...getDraft(), ...changes };
    if (!saveDraft(next)) return null;
    setDraft(next);
    return next;
  }, []);

  return { draft, ready, patch, setDraft };
}
