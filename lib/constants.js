/* ============================================================
   OCD LIVE — Constantes et réglages par défaut
   Les tarifs et horaires sont modifiables depuis /admin :
   ils sont alors sauvegardés par-dessus ces valeurs.
   ============================================================ */

export const DEFAULT_SETTINGS = {
  adminEmail: 'contact@ocdlive.com',
  adminPhone: '22890000000', // WhatsApp de l'équipe, format international sans +
  adminCode: 'ocd2026',      // code d'accès du tableau de bord (prototype)
  address: 'Studio OCD Live — Lomé, Togo',
  slotsPresentiel: ['09:00', '11:00', '14:00', '16:00', '18:00'],
  slotsDistance: ['09:00', '11:00', '14:00', '16:00', '18:00', '20:00'],
  closedWeekdaysPresentiel: [0], // 0 = dimanche, studio fermé
  closedWeekdaysDistance: [],    // à distance : 7j/7
  packages: {
    presentiel: [
      {
        id: 'p1', name: 'Essentiel', duration: '1 heure de live', price: 15000, tag: '',
        perks: ['1 h de direct animé', 'Studio, lumière et son', 'Jusqu’à 5 produits présentés', 'Diffusion sur la page OCD Live']
      },
      {
        id: 'p2', name: 'Confort', duration: '2 heures de live', price: 25000, tag: 'Le + choisi',
        perks: ['2 h de direct animé', 'Studio, lumière et son', 'Jusqu’à 12 produits présentés', 'Diffusion sur la page OCD Live', 'Replay envoyé après le live']
      },
      {
        id: 'p3', name: 'Hebdo', duration: '3 lives dans la semaine', price: 39000, compareAt: 45000, tag: 'Abonnement',
        perks: ['3 directs de 1 h dans la semaine', 'Vos produits repostés par Bovan', 'Reposts sur les réseaux OCD Live', 'Visuel de teasing offert', 'Priorité sur les créneaux']
      },
      {
        id: 'p4', name: 'Mensuel', duration: '12 lives dans le mois', price: 145000, compareAt: 180000, tag: 'Abonnement',
        perks: ['12 directs dans le mois', 'Reposts sur tous les comptes de Bovan', 'Mise en avant sur la page OCD Live', '2 montages vidéo courts par mois', 'Chef de projet dédié', 'Bilan de performance mensuel']
      }
    ],
    distance: [
      {
        id: 'd1', name: 'Essentiel', duration: '1 heure de live', price: 12000, tag: '',
        perks: ['1 h de direct en visio', 'Test technique avant le live', 'Jusqu’à 5 produits présentés', 'Diffusion sur la page OCD Live']
      },
      {
        id: 'd2', name: 'Confort', duration: '2 heures de live', price: 20000, tag: 'Le + choisi',
        perks: ['2 h de direct en visio', 'Test technique avant le live', 'Jusqu’à 12 produits présentés', 'Diffusion sur la page OCD Live', 'Replay envoyé après le live']
      },
      {
        id: 'd3', name: 'Hebdo', duration: '3 lives dans la semaine', price: 31000, compareAt: 36000, tag: 'Abonnement',
        perks: ['3 directs de 1 h dans la semaine', 'Vos produits repostés par Bovan', 'Reposts sur les réseaux OCD Live', 'Visuel de teasing offert', 'Priorité sur les créneaux']
      },
      {
        id: 'd4', name: 'Mensuel', duration: '12 lives dans le mois', price: 115000, compareAt: 144000, tag: 'Abonnement',
        perks: ['12 directs dans le mois', 'Reposts sur tous les comptes de Bovan', 'Mise en avant sur la page OCD Live', '2 montages vidéo courts par mois', 'Chef de projet dédié', 'Bilan de performance mensuel']
      }
    ]
  }
};

/* Les 5 étapes du tunnel : une page par étape.
   Le choix de la formule arrive en dernier, juste avant la validation :
   le client sait alors exactement ce qu'il réserve et combien il paie. */
export const STEPS = [
  { n: 1, label: 'Format', short: 'Format', href: '/reservation/format' },
  { n: 2, label: 'Date & heure', short: 'Date', href: '/reservation/date' },
  { n: 3, label: 'Vos informations', short: 'Infos', href: '/reservation/informations' },
  { n: 4, label: 'Formule & validation', short: 'Formule', href: '/reservation/formule' },
  { n: 5, label: 'Confirmation', short: 'Fini', href: '/reservation/confirmation' }
];

export const SECTORS = [
  'Mode et prêt-à-porter',
  'Chaussures et maroquinerie',
  'Cosmétiques et soins',
  'Cheveux et perruques',
  'Bijoux et accessoires',
  'Électronique et téléphonie',
  'Alimentation et boissons',
  'Maison et décoration',
  'Services (formation, immobilier…)',
  'Autre'
];

export const PAYMENTS = [
  'Mobile Money (Mixx by Yas / Flooz)',
  'Espèces sur place',
  'Virement bancaire',
  'À convenir avec l’équipe'
];

export const SOURCES = ['TikTok', 'Facebook', 'Instagram', 'Bouche-à-oreille', 'Google', 'Autre'];

export const STATUS_LABEL = {
  nouveau: 'Nouveau',
  confirme: 'Confirmé',
  termine: 'Terminé',
  annule: 'Annulé'
};

export const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export const modeLabel = (m) => (m === 'presentiel' ? 'En présentiel — Lomé (Togo)' : 'À distance');
