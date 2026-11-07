'use client';

/* ============================================================
   ESPACE ÉQUIPE — /admin
   Accès protégé par un code (prototype : contrôle côté
   navigateur, à remplacer par une vraie authentification).
   ============================================================ */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { Bell } from '@/components/Icons';
import { useSettings, useNotifications, markAllRead } from '@/lib/store';
import BookingsTab from './BookingsTab';
import DispoTab from './DispoTab';
import SettingsTab from './SettingsTab';

const TABS = [
  { id: 'bookings', label: 'Réservations' },
  { id: 'dispo', label: 'Disponibilités' },
  { id: 'settings', label: 'Paramètres' }
];

export default function AdminPage() {
  const settings = useSettings();
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('bookings');
  const [showNotifs, setShowNotifs] = useState(false);
  const { notifs, unread } = useNotifications();

  /* L'écran de saisie du code est rendu dès le serveur : la page
     n'est jamais blanche, même si le JavaScript tarde. On bascule
     ensuite sur le tableau de bord si une session est déjà ouverte. */
  useEffect(() => {
    try {
      if (sessionStorage.getItem('ocd_admin') === '1') setUnlocked(true);
    } catch {
      /* stockage indisponible */
    }
  }, []);

  // fermeture du panneau de notifications au clic extérieur
  useEffect(() => {
    if (!showNotifs) return undefined;
    const close = (e) => {
      if (!e.target.closest('.notif-panel') && !e.target.closest('.bell')) setShowNotifs(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showNotifs]);

  function submitCode(e) {
    e.preventDefault();
    if (code.trim() === settings.adminCode) {
      try {
        sessionStorage.setItem('ocd_admin', '1');
      } catch {
        /* stockage indisponible */
      }
      setUnlocked(true);
    } else {
      setError(true);
    }
  }

  function logout() {
    try {
      sessionStorage.removeItem('ocd_admin');
    } catch {
      /* stockage indisponible */
    }
    setUnlocked(false);
    setCode('');
  }

  /* ---------------- Écran d'accès ---------------- */
  if (!unlocked) {
    return (
      <div className="gate">
        <form className="card gate-card" onSubmit={submitCode}>
          <Logo href={null} />
          <h2>Espace équipe</h2>
          <p>Entrez le code d’accès pour voir les réservations.</p>
          <div className="field">
            <input
              type="password"
              autoComplete="off"
              placeholder="Code d’accès"
              className={error ? 'invalid' : ''}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(false);
              }}
            />
            <span className={`field-error${error ? ' show' : ''}`}>Code incorrect.</span>
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
            Entrer
          </button>
          <p className="gate-hint">
            Prototype — code par défaut : <b>ocd2026</b>
          </p>
          <p className="gate-hint">
            <Link href="/" style={{ color: 'var(--orange)' }}>
              ← Retour au site
            </Link>
          </p>
        </form>
      </div>
    );
  }

  /* ---------------- Tableau de bord ---------------- */
  return (
    <div className="admin-body">
      <header className="site-header admin-header">
        <div className="wrap header-inner">
          <Logo />
          <div className="admin-tools">
            <button
              type="button"
              className="bell"
              title="Notifications"
              onClick={() => setShowNotifs((v) => !v)}
            >
              <Bell />
              {unread > 0 && <span className="count">{unread}</span>}
            </button>
            <Link href="/" className="btn btn-ghost btn-sm">
              Voir le site
            </Link>
            <button type="button" className="btn btn-dark btn-sm" onClick={logout}>
              Quitter
            </button>
          </div>
        </div>
      </header>

      {showNotifs && (
        <div className="notif-panel">
          <header>
            <h4>Notifications</h4>
            {notifs.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  markAllRead();
                  setShowNotifs(false);
                }}
              >
                Tout marquer lu
              </button>
            )}
          </header>
          {notifs.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <p>Aucune notification.</p>
            </div>
          ) : (
            notifs.slice(0, 30).map((n) => (
              <div key={n.id} className={`notif-item${n.read ? '' : ' unread'}`}>
                <b>{n.title}</b>
                <p>{n.body}</p>
                <time>{new Date(n.createdAt).toLocaleString('fr-FR')}</time>
              </div>
            ))
          )}
        </div>
      )}

      <main className="admin-main">
        <div className="wrap">
          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tab${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'bookings' && <BookingsTab />}
          {tab === 'dispo' && <DispoTab />}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}
