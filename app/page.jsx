import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import PackagesShowcase from '@/components/PackagesShowcase';
import { Check, Pin, Video } from '@/components/Icons';

const FAQ = [
  {
    q: 'Est-ce que OCD Live vend mes produits à ma place ?',
    a: 'Non. Le live sert à montrer votre produit, son prix et votre numéro de téléphone. Les clients intéressés vous contactent directement et vous gérez la vente et la livraison comme d’habitude. Nous ne prenons aucune commission.'
  },
  {
    q: 'Que dois-je apporter le jour du live ?',
    a: 'Vos produits, et c’est tout. Le studio fournit la lumière, le son, le décor, la connexion et l’animateur. Arrivez 20 minutes avant votre créneau pour l’installation.'
  },
  {
    q: 'Comment se passe un live à distance ?',
    a: 'Nous vous envoyons un lien de connexion et nous faisons un test technique la veille. Vous filmez depuis votre téléphone, chez vous ou dans votre boutique, et nous diffusons sur nos pages avec l’habillage OCD Live.'
  },
  {
    q: 'Que comprennent les abonnements Hebdo et Mensuel ?',
    a: 'En plus de vos directs, Bovan reposte lui-même vos produits sur ses comptes personnels et sur les pages OCD Live. C’est l’avantage principal de ces formules : votre produit continue de circuler entre deux lives.'
  },
  {
    q: 'Et si je dois annuler ou décaler ?',
    a: 'Un report est possible sans frais jusqu’à 48 h avant le créneau, dans la limite des disponibilités. Écrivez-nous sur WhatsApp avec votre numéro de réservation.'
  },
  {
    q: 'Comment payer ?',
    a: 'Mobile Money (Mixx by Yas, Flooz), espèces sur place ou virement. Le paiement se finalise avec l’équipe lors de l’appel de confirmation — rien n’est prélevé sur ce site.'
  }
];

const ETAPES = [
  { n: 1, t: 'Vous réservez', d: 'Format, date, heure et formule. Deux minutes, sans appel téléphonique.' },
  { n: 2, t: 'On vous rappelle', d: 'L’équipe confirme le créneau par WhatsApp dans les 24 h et règle les détails.' },
  { n: 3, t: 'On prépare le plateau', d: 'Vos produits, votre numéro et vos prix sont préparés à l’écran avant le direct.' },
  { n: 4, t: 'Vous passez en direct', d: 'Vous présentez, on anime et on diffuse. Les clients vous appellent directement.' }
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ---------- Héros ---------- */}
        <section className="hero" id="accueil">
          <div className="wrap hero-grid">
            <div>
              <span className="eyebrow">
                <i className="dot-live" /> Studio de live shopping — Lomé, Togo
              </span>
              <h1>
                Présentez vos produits <span>en direct.</span> On s’occupe du reste.
              </h1>
              <p className="hero-lead">
                Réservez un créneau, venez avec vos produits, repartez avec de la visibilité et des
                contacts. En présentiel dans notre studio à Lomé, ou à distance depuis n’importe où.
              </p>
              <div className="hero-cta">
                <Link href="/reservation/format" className="btn btn-primary">
                  Réserver mon live
                </Link>
                <Link href="#methode" className="btn btn-ghost">
                  Comment ça marche
                </Link>
              </div>
              <div className="hero-stats">
                <div>
                  <b>2 min</b>
                  <span>pour réserver</span>
                </div>
                <div>
                  <b>7j/7</b>
                  <span>à distance</span>
                </div>
                <div>
                  <b>0 commission</b>
                  <span>sur vos ventes</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <Image
                src="/logo-mur.jpg"
                alt="Le studio OCD Live à Lomé"
                width={720}
                height={340}
                priority
              />
            </div>
          </div>
        </section>

        {/* ---------- Les deux formats ---------- */}
        <section className="section" id="formats">
          <div className="section-head center wrap">
            <div className="label">Deux façons de faire</div>
            <h2>Quel type de live voulez-vous faire ?</h2>
            <p>Choisissez votre format, le reste du parcours se fait en quatre écrans.</p>
          </div>
          <div className="wrap">
            <div className="mode-grid">
              <Link href="/reservation/format?mode=presentiel" className="choice">
                <div className="mode-card">
                  <span className="mode-icon">
                    <Pin />
                  </span>
                  <h3>En présentiel</h3>
                  <p>
                    Vous venez au studio OCD Live à Lomé avec vos produits. Lumière, son, décor et
                    animateur prêts à l’avance.
                  </p>
                  <div className="mode-meta">
                    <span className="chip">Lomé, Togo</span>
                    <span className="chip">Lundi au samedi</span>
                    <span className="chip">Dès 15 000 FCFA</span>
                  </div>
                </div>
              </Link>

              <Link href="/reservation/format?mode=distance" className="choice">
                <div className="mode-card">
                  <span className="mode-icon">
                    <Video />
                  </span>
                  <h3>À distance</h3>
                  <p>
                    Vous faites le direct depuis chez vous ou votre boutique. On vous connecte, on
                    anime et on diffuse sur nos pages.
                  </p>
                  <div className="mode-meta">
                    <span className="chip">Partout</span>
                    <span className="chip">7j/7, jusqu’à 21h</span>
                    <span className="chip">Dès 12 000 FCFA</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- Formules ---------- */}
        <section
          className="section"
          id="formules"
          style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}
        >
          <div className="wrap">
            <div className="section-head center">
              <div className="label">Tarifs</div>
              <h2>Des formules claires, sans commission</h2>
              <p>
                Vous payez le temps d’antenne et l’accompagnement. Ce que vous vendez vous appartient
                à 100 %.
              </p>
            </div>
            <PackagesShowcase />
            <p className="center muted" style={{ marginTop: 22, fontSize: '.85rem' }}>
              Tarifs affichés pour le présentiel à Lomé. Les tarifs à distance sont visibles au moment
              de la réservation.
            </p>
          </div>
        </section>

        {/* ---------- Comment ça marche ---------- */}
        <section className="section" id="methode">
          <div className="wrap">
            <div className="section-head center">
              <div className="label">En 4 étapes</div>
              <h2>De la réservation au direct</h2>
            </div>
            <div className="steps-grid">
              {ETAPES.map((e) => (
                <div className="step-card" key={e.n}>
                  <div className="step-num">{e.n}</div>
                  <h3>{e.t}</h3>
                  <p>{e.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- À propos ---------- */}
        <section className="section" id="apropos">
          <div className="wrap">
            <div className="about">
              <div className="about-grid">
                <div className="about-photo">
                  <Image
                    src="/promoteur.jpg"
                    alt="Bovan, fondateur de OCD Live"
                    width={600}
                    height={330}
                  />
                </div>
                <div>
                  <div className="label">Le promoteur</div>
                  <h2>Bovan, et l’idée derrière OCD Live</h2>
                  <p>
                    OCD Live est né d’un constat simple : au Togo, beaucoup de commerçants ont de bons
                    produits mais personne pour les montrer. Le direct règle ça en une heure.
                  </p>
                  <p>
                    Ici, l’objectif n’est pas de vendre à votre place. C’est de faire voir votre
                    produit, votre prix et votre numéro par le plus de monde possible. La vente, vous
                    la concluez vous-même, à votre façon.
                  </p>
                  <ul className="about-points">
                    {[
                      'Un studio équipé à Lomé, et une formule à distance pour toute l’Afrique de l’Ouest',
                      'Vos produits repostés sur les comptes de Bovan avec les abonnements',
                      'Aucune commission prélevée sur ce que vous vendez',
                      'Un interlocuteur unique du premier message jusqu’au replay'
                    ].map((point) => (
                      <li key={point}>
                        <Check size={18} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="section" id="faq">
          <div className="wrap">
            <div className="section-head center">
              <div className="label">Questions fréquentes</div>
              <h2>Ce qu’on nous demande le plus</h2>
            </div>
            <div className="faq">
              {FAQ.map((item, i) => (
                <details key={item.q} open={i === 0}>
                  <summary>{item.q}</summary>
                  <div className="faq-body">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Bandeau final ---------- */}
        <section className="section">
          <div className="wrap">
            <div className="cta-band">
              <h2>Votre produit mérite d’être vu</h2>
              <p>Le prochain créneau libre est peut-être cette semaine.</p>
              <Link href="/reservation/format" className="btn">
                Réserver mon live
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
