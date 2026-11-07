import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ToastHost } from '@/components/Toast';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta'
});

export const metadata = {
  title: {
    default: 'OCD Live — Réservez votre live de vente à Lomé ou à distance',
    template: '%s — OCD Live'
  },
  description:
    'OCD Live by Bovan Group : réservez un direct pour présenter vos produits. En présentiel au studio de Lomé (Togo) ou à distance. Réservation en 2 minutes, sans commission.',
  keywords: ['OCD Live', 'live shopping', 'Lomé', 'Togo', 'Bovan Group', 'vente en direct'],
  openGraph: {
    title: 'OCD Live — Présentez vos produits en direct',
    description: 'Studio de live shopping à Lomé. Réservez votre créneau en 2 minutes.',
    locale: 'fr_TG',
    type: 'website'
  }
};

export const viewport = {
  themeColor: '#E8761A',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body>
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
