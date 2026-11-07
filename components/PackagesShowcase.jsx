'use client';

import { useSettings } from '@/lib/store';
import PackageCard from './PackageCard';

/** Vitrine des formules sur la page d'accueil (tarifs présentiel). */
export default function PackagesShowcase() {
  const settings = useSettings();
  return (
    <div className="pack-grid">
      {settings.packages.presentiel.map((pack) => (
        <PackageCard key={pack.id} pack={pack} />
      ))}
    </div>
  );
}
