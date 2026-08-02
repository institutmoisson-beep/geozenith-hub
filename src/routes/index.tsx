import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  BellRing,
  CarFront,
  FileText,
  Fuel,
  MapPinned,
  MessageCircle,
  Radar,
  Route as RouteIcon,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import heroMap from "@/assets/hero-map.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MSN Tracker — Plateforme GPS de flotte | Institut Moisson" },
      {
        name: "description",
        content:
          "MSN Tracker by Institut Moisson : suivi GPS temps réel, géofencing, alertes WhatsApp, rapports PDF et facturation pour votre flotte.",
      },
      { property: "og:title", content: "MSN Tracker — Plateforme GPS de flotte | Institut Moisson" },
      {
        property: "og:description",
        content:
          "MSN Tracker by Institut Moisson : suivi GPS temps réel, géofencing, alertes WhatsApp, rapports PDF et facturation pour votre flotte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: MapPinned,
    title: "Carte temps réel",
    text: "Suivi live de chaque véhicule sur OpenStreetMap, avec clustering et statut moteur.",
  },
  {
    icon: CarFront,
    title: "Gestion de flotte",
    text: "Véhicules, chauffeurs, groupes et affectations centralisés dans une seule console.",
  },
  {
    icon: RouteIcon,
    title: "Historique des trajets",
    text: "Rejouez chaque parcours, distances, arrêts et vitesses sur la période de votre choix.",
  },
  {
    icon: Radar,
    title: "Géofencing",
    text: "Zones illimitées avec déclencheurs d'entrée et de sortie sur mesure.",
  },
  {
    icon: BellRing,
    title: "Alertes intelligentes",
    text: "Excès de vitesse, coupure moteur, batterie faible, mouvement non autorisé.",
  },
  {
    icon: MessageCircle,
    title: "Notifications WhatsApp",
    text: "Vos équipes reçoivent l'alerte là où elles la lisent vraiment, en quelques secondes.",
  },
  {
    icon: FileText,
    title: "Rapports PDF",
    text: "Rapports d'activité, kilométrage et conduite exportables et planifiables.",
  },
  {
    icon: Activity,
    title: "Dashboard statistiques",
    text: "Indicateurs de flotte, taux d'utilisation et tendances sur une vue unique.",
  },
  {
    icon: ShieldCheck,
    title: "Multi-utilisateurs",
    text: "Authentification sécurisée, rôles et cloisonnement des données par organisation.",
  },
  {
    icon: Fuel,
    title: "Facturation & abonnements",
    text: "Plans, quotas de véhicules et factures gérés directement dans la plateforme.",
  },
  {
    icon: Smartphone,
    title: "Application mobile PWA",
    text: "Installable sur Android et iOS, pensée pour un usage terrain.",
  },
  {
    icon: Users,
    title: "Connecteur Traccar",
    text: "Compatible avec les traceurs du marché via l'API Traccar, sans changer de matériel.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "15 000",
    tag: "par mois",
    desc: "Pour démarrer avec une petite flotte.",
    items: ["Jusqu'à 5 véhicules", "Carte temps réel", "Historique 30 jours", "Alertes e-mail"],
    featured: false,
  },
  {
    name: "Business",
    price: "45 000",
    tag: "par mois",
    desc: "Le choix des flottes en croissance.",
    items: [
      "Jusqu'à 30 véhicules",
      "Géofencing illimité",
      "Notifications WhatsApp",
      "Rapports PDF planifiés",
      "Multi-utilisateurs & rôles",
    ],
    featured: true,
  },
  {
    name: "Entreprise",
    price: "Sur devis",
    tag: "",
    desc: "Flottes étendues et besoins spécifiques.",
    items: [
      "Véhicules illimités",
      "API & intégrations",
      "Assistant IA embarqué",
      "Accompagnement dédié",
    ],
    featured: false,
  },
];

const stats = [
  { value: "10 s", label: "Fréquence de rafraîchissement" },
  { value: "99,9 %", label: "Disponibilité visée" },
  { value: "24/7", label: "Surveillance de flotte" },
  { value: "100 %", label: "Compatible Traccar" },
];

function Index() {
  return (
    <div id="top" className="min-h-screen bg-background text-foreground">
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <img
            src={heroMap}
            alt="Carte urbaine avec trajets de véhicules suivis en temps réel"
            width={1600}
            height={1008}
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
          <div className="relative mx-auto max-w-7xl px-5 py-24 md:py-32">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-khaki/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Plateforme GPS premium
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Pilotez votre flotte <span className="text-gradient-brand">en temps réel</span>, où
              qu'elle roule.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              MSN Tracker réunit le suivi GPS, le géofencing, les alertes WhatsApp et les rapports
              PDF dans une console unique conçue pour les gestionnaires exigeants.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#contact"
                className="glow-brand rounded-full bg-gradient-brand px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
              >
                Démarrer maintenant
              </a>
              <a
                href="#fonctionnalites"
                className="rounded-full border border-border px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Voir les fonctionnalités
              </a>
            </div>

            <dl className="mt-16 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-khaki/80 px-5 py-6 backdrop-blur">
                  <dt className="font-display text-2xl font-bold text-gradient-brand">{s.value}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Features */}
        <section id="fonctionnalites" className="mx-auto max-w-7xl px-5 py-24">
          <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">
            Tout ce qu'une flotte moderne exige
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Une seule plateforme, du traceur au rapport mensuel.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article key={f.title} className="surface-card group p-6 transition-colors">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Platform */}
        <section id="plateforme" className="border-y border-border/70 bg-khaki-deep">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Une technologie <span className="text-gradient-brand">ouverte</span> et souveraine
              </h2>
              <p className="mt-5 text-muted-foreground">
                MSN Tracker s'appuie sur l'API Traccar pour le matériel, OpenStreetMap et Leaflet
                pour la cartographie, et un assistant IA embarqué pour analyser vos trajets. Vos
                données restent les vôtres.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Compatible avec les traceurs GPS déjà installés",
                  "Cartographie OpenStreetMap sans frais de licence",
                  "Analyse de conduite assistée par IA",
                  "Accès mobile hors ligne via PWA",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gradient-brand" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface-card overflow-hidden p-2">
              <img
                src={heroMap}
                alt="Aperçu de la console de suivi MSN Tracker"
                width={1600}
                height={1008}
                loading="lazy"
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="tarifs" className="mx-auto max-w-7xl px-5 py-24">
          <h2 className="text-3xl font-bold sm:text-4xl">Des abonnements clairs</h2>
          <p className="mt-4 text-muted-foreground">Tarifs en FCFA, sans engagement de durée.</p>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {plans.map((p) => (
              <article
                key={p.name}
                className={`surface-card flex flex-col p-7 ${p.featured ? "glow-brand ring-1 ring-primary/60" : ""}`}
              >
                {p.featured && (
                  <span className="mb-4 inline-flex w-fit rounded-full bg-gradient-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                    Le plus choisi
                  </span>
                )}
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                <p className="mt-6 font-display text-3xl font-bold">
                  {p.price}
                  {p.tag && (
                    <span className="ml-2 text-sm font-medium text-muted-foreground">
                      FCFA {p.tag}
                    </span>
                  )}
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                  {p.items.map((i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gradient-brand" />
                      {i}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`mt-8 rounded-full px-5 py-3 text-center text-sm font-semibold transition-colors ${
                    p.featured
                      ? "bg-gradient-brand text-primary-foreground"
                      : "border border-border hover:bg-secondary"
                  }`}
                >
                  Choisir {p.name}
                </a>
              </article>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mx-auto max-w-7xl px-5 pb-24">
          <div className="surface-card glow-brand flex flex-col items-start gap-8 p-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold">Prêt à équiper votre flotte&nbsp;?</h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Parlons de vos véhicules, de vos traceurs et de vos besoins. L'équipe Institut
                Moisson vous accompagne de l'installation au premier rapport.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href="tel:+2250507348685"
                className="rounded-full bg-gradient-brand px-7 py-3.5 text-center text-sm font-semibold text-primary-foreground"
              >
                +225 05 07 34 86 85
              </a>
              <a
                href="https://wa.me/2250507348685"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-7 py-3.5 text-center text-sm font-semibold hover:bg-secondary"
              >
                Écrire sur WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
