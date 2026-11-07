export const metadata = {
  title: 'Espace équipe',
  // L'espace équipe ne doit jamais remonter dans les résultats de recherche.
  robots: { index: false, follow: false, nocache: true }
};

export default function AdminLayout({ children }) {
  return children;
}
