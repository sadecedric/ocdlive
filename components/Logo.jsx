import Link from 'next/link';

export default function Logo({ href = '/' }) {
  const content = (
    <>
      <span className="logo-mark">
        <svg viewBox="0 0 32 20" fill="none" stroke="#fff" strokeWidth="3.2">
          <circle cx="10" cy="10" r="7.5" />
          <circle cx="22" cy="10" r="7.5" />
        </svg>
      </span>
      <span className="logo-text">
        <span className="o">OCD</span> <span className="l">Live</span>
      </span>
    </>
  );

  if (!href) return <span className="logo">{content}</span>;
  return (
    <Link href={href} className="logo" aria-label="OCD Live, accueil">
      {content}
    </Link>
  );
}
