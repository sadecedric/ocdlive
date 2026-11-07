import Link from 'next/link';
import Logo from './Logo';

export default function SiteHeader({ compact = false }) {
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Logo />
        {!compact && (
          <nav className="nav">
            <Link href="/reservation/format">Réserver</Link>
            <Link href="/#formules">Formules</Link>
            <Link href="/#methode">Comment ça marche</Link>
            <Link href="/#apropos">À propos</Link>
            <Link href="/#faq">FAQ</Link>
          </nav>
        )}
        <Link href="/reservation/format" className="btn btn-primary btn-sm">
          Réserver un live
        </Link>
      </div>
    </header>
  );
}
