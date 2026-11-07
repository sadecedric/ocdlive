import FunnelHeader from '@/components/FunnelHeader';

export const metadata = {
  title: 'Réserver un live',
  robots: { index: false }
};

/* Le tunnel a sa propre coquille : pas de barre de navigation,
   pas de pied de page. Le client n'a qu'une chose à faire. */
export default function ReservationLayout({ children }) {
  return (
    <div className="funnel">
      <FunnelHeader />
      <main className="funnel-main">
        <div className="wrap">{children}</div>
      </main>
    </div>
  );
}
