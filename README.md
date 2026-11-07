# OCD Live — réservation de lives de vente

Prototype du site de **OCD Live (Bovan Group)**, Lomé — Togo.
Next.js 15 (App Router) + React 19, prêt à déployer sur Vercel.

Le parcours se fait en **cinq pages distinctes** : chaque étape est un formulaire qui valide ses
propres champs puis redirige vers la suivante.

---

## Démarrer en local

```bash
npm install
npm run dev
```

Puis ouvrir <http://localhost:3000>.

| Page | Adresse |
|---|---|
| Accueil | `/` |
| Étape 1 — Format du live | `/reservation/format` |
| Étape 2 — Date et heure | `/reservation/date` |
| Étape 3 — Vos informations et produits | `/reservation/informations` |
| Étape 4 — Formule et validation | `/reservation/formule` |
| Étape 5 — Confirmation | `/reservation/confirmation` |
| Espace équipe | `/admin` — code par défaut **`ocd2026`** |

Depuis l'accueil, les deux cartes de format pointent sur `/reservation/format?mode=presentiel`
ou `?mode=distance` : le choix arrive présélectionné.

---

## Le tunnel de réservation

**Pas de barre de navigation, pas de pied de page.** Une fois dans le parcours, l'écran ne
propose plus rien d'autre que l'étape en cours : un bandeau avec le logo, la progression,
un lien d'aide WhatsApp et une croix pour sortir. C'est ce qui évite les abandons en cours de route.

Le **choix de la formule arrive en dernier**, juste avant la validation : à ce moment le client a
déjà sous les yeux son format, sa date, ses coordonnées et ses produits, chacun avec un lien
« Modifier ». Il choisit son tarif en sachant exactement ce qu'il réserve, puis confirme.

Le parcours reprend là où il a été laissé : revenir en arrière ne fait rien perdre, et accéder
directement à une étape sans avoir rempli les précédentes renvoie automatiquement au bon endroit.

### Pensé pour le téléphone d'abord

- Barre d'action **fixée en bas de l'écran** sur mobile, avec le rappel du choix et le montant :
  le bouton principal reste toujours sous le pouce.
- Champs de saisie à 16 px et cibles tactiles de 46 px minimum — pas de zoom intempestif sur iPhone,
  pas de bouton qu'on rate.
- Le fil des cinq étapes laisse place à une barre de progression fine au-dessus du titre.
- Calendrier, créneaux, produits et récapitulatif passent en une colonne, sans défilement horizontal.
- Côté équipe, le tableau des réservations devient une **liste de cartes** sur petit écran.

---

## Déployer sur Vercel

1. Mettre le dossier sur GitHub (`git init`, commit, push).
2. Sur [vercel.com](https://vercel.com) : **Add New → Project**, importer le dépôt.
3. Ne rien changer aux réglages — Vercel détecte Next.js seul. **Deploy**.

### Pour recevoir les réservations par e-mail (facultatif)

Dans **Settings → Environment Variables** :

| Variable | Valeur |
|---|---|
| `RESEND_API_KEY` | clé obtenue sur [resend.com](https://resend.com) (gratuit, 100 e-mails/jour) |
| `NOTIFY_EMAIL` | l'adresse de l'équipe |
| `NOTIFY_FROM` | `OCD Live <onboarding@resend.dev>` tant que le domaine n'est pas vérifié |

Puis redéployer. Chaque réservation déclenche alors un e-mail avec le récapitulatif complet.
Sans ces variables, la route `/api/notify` répond « non configuré » et la réservation reste
visible dans `/admin`.

---

## Côté équipe — `/admin`

- **Notification à chaque réservation** : cloche avec compteur de non-lus, mise à jour immédiate
  même depuis un autre onglet.
- **Indicateurs** : total, lives à venir, dossiers à traiter, chiffre d'affaires engagé.
- **Liste** : recherche, filtres par statut et par format, fiche détaillée (produits, coordonnées,
  note du client), changement de statut, WhatsApp client, e-mail pré-rempli, copie du
  récapitulatif, export CSV ouvrable dans Excel.
- **Disponibilités** : fermer ou rouvrir un jour d'un clic, modifier les horaires proposés.
- **Paramètres** : coordonnées de l'équipe, code d'accès, et **modification des tarifs sans toucher
  au code** — le site public se met à jour aussitôt.
- **Données de démonstration** : un bouton génère cinq réservations réalistes.

---

## Choix et ajouts par rapport au brief initial

| Ajout | Pourquoi |
|---|---|
| Formule choisie en dernière étape | Le client ne choisit son tarif qu'une fois tout le reste réglé, avec le récapitulatif sous les yeux. Moins d'abandon au moment du prix. |
| Tunnel sans navigation ni pied de page | Une seule action possible par écran. |
| Tarifs distincts présentiel / distance | Un live à distance ne mobilise ni le studio ni l'équipe technique. **Montants à valider.** |
| Abonnements réellement avantageux | 3 lives à l'unité coûtent 45 000 F ; l'abonnement Hebdo est à 39 000 F, avec les reposts en plus. L'économie est affichée sur la carte. **À valider.** |
| Nombre de créneaux libres sur chaque jour | Crée le sentiment de rareté et évite les allers-retours. |
| Blocage des créneaux pris, et de ceux à moins de 2 h | Évite les doubles réservations et les demandes impossibles à honorer. |
| Numéro de réservation (`OCD-26-1234`) | Référence commune entre le client et l'équipe. |
| Bouton WhatsApp pré-rempli | Au Togo, WhatsApp est le vrai canal de confirmation. |
| Ajout au calendrier (`.ics`) | Réduit les oublis le jour du live. |
| Champ « moyen de paiement prévu » | Prépare l'appel de confirmation sans imposer un paiement en ligne. |
| Champ « comment nous avez-vous connus » | Donne à Bovan une mesure gratuite de son marketing. |
| Export CSV | Permet de suivre le chiffre d'affaires hors du site. |
| Mention « 0 commission sur vos ventes » | Reprend l'intention du brief : montrer le produit, pas vendre à la place du client. |

### Grille tarifaire actuelle

| Formule | Présentiel | À distance |
|---|---|---|
| Essentiel — 1 h | 15 000 F | 12 000 F |
| Confort — 2 h | 25 000 F | 20 000 F |
| Hebdo — 3 lives + reposts par Bovan | 39 000 F / semaine | 31 000 F / semaine |
| Mensuel — 12 lives + reposts + mise en avant | 145 000 F / mois | 115 000 F / mois |

Tout est modifiable depuis `/admin` → Paramètres, sans toucher au code.

---

## Limite à connaître

Les réservations sont enregistrées dans le **navigateur du visiteur** (`localStorage`), pas sur un
serveur. Les réservations faites sur un téléphone apparaissent dans le `/admin` **de ce même
téléphone**. C'est suffisant pour tester le parcours de bout en bout, et volontaire : le prototype
se déploie sans base de données ni compte à créer.

Pour une mise en service réelle, tout passe par un seul fichier : [`lib/store.js`](lib/store.js).
Les fonctions marquées `[API]` (`addBooking`, `updateBooking`, `deleteBooking`) sont les seules à
remplacer par des appels HTTP — vers Vercel Postgres, Supabase ou Firebase. Le reste de
l'application n'a pas à changer.

Pistes pour une v2 : acompte en ligne par Mobile Money, photos de produits, rappel automatique
24 h avant le live, planning public des lives à venir, espace client.

---

## Structure

```
app/
  page.jsx                        accueil
  layout.jsx                      police, métadonnées, toasts
  globals.css                     habillage complet
  reservation/
    layout.jsx                    coquille du tunnel (ni nav, ni footer)
    format/                       étape 1
    date/                         étape 2
    informations/                 étape 3
    formule/                      étape 4 — formule et validation
    confirmation/                 étape 5
  admin/                          espace équipe (onglets)
  api/notify/route.js             envoi e-mail à l'équipe
components/
  FunnelHeader.jsx                bandeau et progression du tunnel
  StepHead.jsx / StepNav.jsx      titre et barre d'action d'une étape
  Calendar.jsx, PackageCard.jsx, Icons.jsx, Toast.jsx…
lib/
  constants.js                    tarifs, créneaux, listes de choix
  store.js                        données et notifications  ← point d'entrée backend
  draft.js                        continuité entre les pages du tunnel
  format.js                       dates et prix
public/                           logo du studio, photo du promoteur
_prototype-statique/              première version HTML/CSS/JS (archive)
```
