# OCD Live — site de réservation de lives (prototype)

Prototype fonctionnel du site de réservation de **OCD Live (Bovan Group)**, Lomé — Togo.
Aucune dépendance, aucun compte à créer : trois fichiers HTML/CSS/JS qui tournent dans n'importe quel navigateur.

---

## Lancer le site

**Le plus simple** : double-cliquer sur `index.html`.

**Recommandé pour la démo** (évite les blocages du mode `file://` sur certains navigateurs) :

```bash
cd "OCD Live"
python -m http.server 8000
```

Puis ouvrir <http://localhost:8000>.

- Site public : `index.html`
- Espace équipe : `admin.html` — code d'accès par défaut **`ocd2026`**

---

## Ce que fait le prototype

### Côté client — réservation en 5 étapes

1. **Format du live** — en présentiel (studio de Lomé) ou à distance.
2. **Date et heure** — calendrier du mois en cours, navigation sur 3 mois.
   Les jours passés, fermés ou complets sont désactivés ; chaque jour affiche son nombre de créneaux libres.
3. **Formule** — tarifs à l'heure et abonnements, différents selon le format choisi.
4. **Informations et produits** — identité, activité, téléphone, puis la liste des produits
   (nom, prix, détail) avec ajout et suppression de lignes.
5. **Confirmation** — numéro de réservation, récapitulatif, bouton WhatsApp pré-rempli
   et ajout au calendrier du téléphone (`.ics`).

### Côté équipe — `admin.html`

- **Notification à chaque réservation** : cloche avec compteur de non-lus, et actualisation
  automatique si une réservation arrive pendant que la page est ouverte.
- **Indicateurs** : total, lives à venir, dossiers à traiter, chiffre d'affaires engagé.
- **Tableau des réservations** : recherche, filtres par statut et par format, fiche détaillée
  (produits, coordonnées, note du client), changement de statut, contact WhatsApp du client,
  e-mail pré-rempli, copie du récapitulatif, export CSV (ouvrable dans Excel).
- **Disponibilités** : fermer ou rouvrir un jour en un clic, modifier les horaires proposés.
- **Paramètres** : e-mail et WhatsApp de l'équipe, adresse du studio, code d'accès,
  et **modification des tarifs sans toucher au code** — le site public se met à jour aussitôt.
- **Données de démonstration** : bouton qui génère 5 réservations réalistes pour la présentation.

---

## Choix et ajouts par rapport au brief

| Ajout | Pourquoi |
|---|---|
| Tarifs distincts présentiel / distance | Un live à distance ne mobilise ni le studio ni l'équipe technique ; le distinguer rend l'offre plus lisible et élargit la clientèle hors de Lomé. **Montants à valider par le client.** |
| Nombre de créneaux libres affiché sur chaque jour | Crée le sentiment de rareté et évite les allers-retours dans le calendrier. |
| Blocage automatique d'un créneau déjà réservé, et des créneaux à moins de 2 h | Évite les doubles réservations et les demandes impossibles à honorer. |
| Numéro de réservation (`OCD-26-1234`) | Référence commune entre le client et l'équipe pour tous les échanges. |
| Bouton WhatsApp pré-rempli à la fin | Au Togo, WhatsApp est le canal réel de confirmation. Le client clique, l'équipe reçoit tout. |
| Ajout au calendrier (`.ics`) | Réduit les oublis le jour J. |
| Champ « moyen de paiement prévu » (Mobile Money, espèces, virement) | Prépare l'appel de confirmation sans imposer un paiement en ligne. |
| Champ « comment nous avez-vous connus » | Donne gratuitement à Bovan une mesure de ce qui lui amène des clients. |
| Export CSV | Permet de travailler les données hors du site, de suivre le chiffre d'affaires. |
| Message « 0 commission sur vos ventes » | Reprend l'intention du brief : le live sert à montrer le produit, pas à vendre à la place du client. |

---

## Pour passer en production

Le prototype stocke tout dans le navigateur (`localStorage`). Trois choses à brancher :

1. **Base de données** — remplacer les fonctions marquées `[API]` dans
   [assets/js/store.js](assets/js/store.js) par des appels à un backend
   (Firebase, Supabase, Node + PostgreSQL, ou PHP/MySQL sur un hébergement local).
2. **Notification e-mail réelle** — la fonction `notifyAdmin()` du même fichier construit déjà
   le message complet. Deux blocs commentés montrent comment l'envoyer via un service sans backend
   (FormSubmit, EmailJS, Make) ou via une route maison `/api/notify`.
   Un envoi WhatsApp automatique est possible avec l'API WhatsApp Business.
3. **Sécurité de l'espace équipe** — le code d'accès actuel est côté navigateur, suffisant pour
   une démonstration, à remplacer par une vraie authentification.

Pistes pour une v2 : acompte en ligne par Mobile Money, photos de produits, rappel automatique
24 h avant le live, page publique du planning des lives à venir, espace client pour suivre ses réservations.

---

## Structure

```
index.html            site public (tunnel de réservation)
admin.html            espace équipe
assets/css/style.css  habillage complet
assets/js/store.js    données, tarifs, notifications  ← point d'entrée pour le backend
assets/js/app.js      logique du tunnel de réservation
assets/js/admin.js    logique du tableau de bord
assets/img/           logo du studio, photo du promoteur
```
