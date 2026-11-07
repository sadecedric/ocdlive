'use client';

import { useEffect, useState } from 'react';

const EVENT = 'ocd:toast';

/** Affiche un message court. Appelable depuis n'importe quel composant client. */
export function toast(message) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

export function ToastHost() {
  const [message, setMessage] = useState('');
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let timer;
    const handler = (e) => {
      setMessage(e.detail);
      setShown(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShown(false), 3200);
    };
    window.addEventListener(EVENT, handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`toast${shown ? ' show' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
