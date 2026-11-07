'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useSettings } from '@/lib/store';

export default function SiteFooter() {
  const settings = useSettings();

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Logo href={null} />
            <p>Studio de live shopping par Bovan Group. Lomé, Togo.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Réserver</h4>
              <Link href="/reservation/format">Live en présentiel</Link>
              <Link href="/reservation/format">Live à distance</Link>
              <Link href="/#formules">Nos formules</Link>
            </div>
            <div className="footer-col">
              <h4>En savoir plus</h4>
              <Link href="/#methode">Comment ça marche</Link>
              <Link href="/#apropos">À propos</Link>
              <Link href="/#faq">FAQ</Link>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <a href={`https://wa.me/${settings.adminPhone}`} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              <a href={`mailto:${settings.adminEmail}`}>E-mail</a>
              <Link href="/admin">Espace équipe</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} OCD Live — Bovan Group. Tous droits réservés.</span>
          <span>Prototype de démonstration</span>
        </div>
      </div>
    </footer>
  );
}
