const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Test1234", 10);

  // ─── 1. Mohamed ── Freelancer Web Developer ───────────────────
  const mohamed = await prisma.user.create({
    data: {
      email: "mohamed@faymoos.com",
      password,
      role: "USER",
    },
  });

  const mohamedIdentity = await prisma.identityProfile.create({
    data: {
      userId: mohamed.id,
      name: "Mohamed Dev",
      slug: "mohamed-dev",
      type: "FREELANCER",
      bio: "Développeur web fullstack passionné par React et Node.js. +5 ans d'expérience.",
      headline: "Freelance Fullstack — React / Next.js / Node",
    },
  });

  const mohamedCapsule = await prisma.capsule.create({
    data: {
      identityId: mohamedIdentity.id,
      title: "Travaillons ensemble",
      objective: "De quoi avez-vous besoin ?",
    },
  });

  const mohamedOptions = [
    {
      label: "Site vitrine",
      branch: {
        headline: "Un site qui vous représente",
        description: "Je crée des sites vitrines modernes, rapides et responsive avec Next.js et Tailwind CSS. Design sur mesure, SEO optimisé.",
        cta: "Demander un devis",
        proof: "30+ sites livrés, 98% de satisfaction client.",
      },
    },
    {
      label: "Application web",
      branch: {
        headline: "Apps sur mesure, de l'idée au déploiement",
        description: "SaaS, dashboards, outils internes — je développe des applications web complètes avec authentification, base de données et API.",
        cta: "Discuter de votre projet",
        proof: "15 applications déployées en production. Stack: React, Node, PostgreSQL.",
      },
    },
    {
      label: "Consultation technique",
      branch: {
        headline: "Audit & conseil technique",
        description: "Besoin d'un avis expert ? Je fais un audit de votre code, architecture ou performance et je vous propose un plan d'amélioration.",
        cta: "Réserver un appel",
        proof: "Noté 5/5 par 20+ clients sur les sessions de conseil.",
      },
    },
  ];

  for (const opt of mohamedOptions) {
    await prisma.capsuleOption.create({
      data: {
        capsuleId: mohamedCapsule.id,
        label: opt.label,
        branch: { create: opt.branch },
      },
    });
  }

  console.log("✅ Mohamed créé avec 1 capsule (3 options)");

  // ─── 2. Ahmed ── Agence de design ────────────────────────────
  const ahmed = await prisma.user.create({
    data: {
      email: "ahmed@faymoos.com",
      password,
      role: "USER",
    },
  });

  const ahmedIdentity = await prisma.identityProfile.create({
    data: {
      userId: ahmed.id,
      name: "Ahmed Studio",
      slug: "ahmed-studio",
      type: "AGENCY",
      bio: "Agence créative spécialisée en branding, UI/UX et identité visuelle pour startups et PME.",
      headline: "Studio Créatif — Branding & UI/UX Design",
    },
  });

  const ahmedCapsule1 = await prisma.capsule.create({
    data: {
      identityId: ahmedIdentity.id,
      title: "Boostez votre image de marque",
      objective: "Quel service vous intéresse ?",
    },
  });

  const ahmedOptions1 = [
    {
      label: "Logo & identité visuelle",
      branch: {
        headline: "Une identité qui marque les esprits",
        description: "Création de logo, charte graphique, palette de couleurs et typographies. Livrable complet en 7 jours.",
        cta: "Voir nos réalisations",
        proof: "200+ logos créés. Clients : startups, restaurants, e-commerce.",
      },
    },
    {
      label: "Design UI/UX",
      branch: {
        headline: "Des interfaces pensées pour vos utilisateurs",
        description: "Wireframes, prototypes Figma, design system complet. On conçoit des interfaces intuitives qui convertissent.",
        cta: "Lancer un projet",
        proof: "Taux de conversion moyen +35% après refonte UI.",
      },
    },
    {
      label: "Pack réseaux sociaux",
      branch: {
        headline: "Templates & contenu visuel",
        description: "Posts Instagram, LinkedIn, stories — on crée vos templates sur-mesure pour une communication cohérente et professionnelle.",
        cta: "Voir les packs",
        proof: "50+ marques accompagnées sur leur stratégie visuelle social media.",
      },
    },
  ];

  for (const opt of ahmedOptions1) {
    await prisma.capsuleOption.create({
      data: {
        capsuleId: ahmedCapsule1.id,
        label: opt.label,
        branch: { create: opt.branch },
      },
    });
  }

  const ahmedCapsule2 = await prisma.capsule.create({
    data: {
      identityId: ahmedIdentity.id,
      title: "Prêt à lancer votre startup ?",
      objective: "Où en êtes-vous dans votre projet ?",
    },
  });

  const ahmedOptions2 = [
    {
      label: "J'ai juste une idée",
      branch: {
        headline: "De l'idée au MVP",
        description: "On vous aide à structurer votre vision, créer un pitch deck et designer votre premier prototype en 2 semaines.",
        cta: "Commencer maintenant",
        proof: "12 startups accompagnées du concept au lancement.",
      },
    },
    {
      label: "J'ai un produit existant",
      branch: {
        headline: "Refonte & optimisation",
        description: "Audit UX, redesign complet et amélioration des performances. On transforme votre produit existant.",
        cta: "Demander un audit gratuit",
        proof: "Amélioration moyenne de 45% du taux de rétention.",
      },
    },
  ];

  for (const opt of ahmedOptions2) {
    await prisma.capsuleOption.create({
      data: {
        capsuleId: ahmedCapsule2.id,
        label: opt.label,
        branch: { create: opt.branch },
      },
    });
  }

  console.log("✅ Ahmed créé avec 2 capsules (3+2 options)");

  // ─── 3. Ahlem ── Créatrice de contenu ────────────────────────
  const ahlem = await prisma.user.create({
    data: {
      email: "ahlem@faymoos.com",
      password,
      role: "USER",
    },
  });

  const ahlemIdentity = await prisma.identityProfile.create({
    data: {
      userId: ahlem.id,
      name: "Ahlem Creates",
      slug: "ahlem-creates",
      type: "CREATOR",
      bio: "Créatrice de contenu digital. YouTube, podcast et formations en ligne sur le marketing et la productivité.",
      headline: "Content Creator — YouTube & Podcast",
    },
  });

  const ahlemCapsule = await prisma.capsule.create({
    data: {
      identityId: ahlemIdentity.id,
      title: "Découvrez mon univers",
      objective: "Qu'est-ce qui vous intéresse ?",
    },
  });

  const ahlemOptions = [
    {
      label: "Formations en ligne",
      branch: {
        headline: "Apprenez à votre rythme",
        description: "Des formations complètes sur le marketing digital, la création de contenu et la productivité. Accès à vie, mises à jour gratuites.",
        cta: "Voir les formations",
        proof: "2000+ étudiants, note moyenne 4.8/5.",
      },
    },
    {
      label: "Coaching 1-on-1",
      branch: {
        headline: "Un accompagnement personnalisé",
        description: "Sessions de coaching individuel pour développer votre marque personnelle, votre chaîne YouTube ou votre stratégie de contenu.",
        cta: "Réserver une session",
        proof: "50+ créateurs accompagnés. Résultat moyen : x3 en abonnés en 6 mois.",
      },
    },
    {
      label: "Collaborations & sponsors",
      branch: {
        headline: "Travaillons ensemble",
        description: "Je collabore avec des marques alignées avec mes valeurs. Formats : vidéo sponsorisée, stories, posts, podcast.",
        cta: "Voir le media kit",
        proof: "Audience : 150K+ abonnés cross-platform. Taux d'engagement : 6.2%.",
      },
    },
    {
      label: "Mon podcast",
      branch: {
        headline: "Écoutez 'Les Clés du Digital'",
        description: "Chaque semaine, j'interview des entrepreneurs, créateurs et marketeurs. Disponible sur Spotify, Apple Podcasts et YouTube.",
        cta: "Écouter maintenant",
        proof: "80+ épisodes, 50K écoutes/mois.",
      },
    },
  ];

  for (const opt of ahlemOptions) {
    await prisma.capsuleOption.create({
      data: {
        capsuleId: ahlemCapsule.id,
        label: opt.label,
        branch: { create: opt.branch },
      },
    });
  }

  console.log("✅ Ahlem créée avec 1 capsule (4 options)");

  // ─── 4. Asma ── Startup SaaS ─────────────────────────────────
  const asma = await prisma.user.create({
    data: {
      email: "asma@faymoos.com",
      password,
      role: "USER",
    },
  });

  const asmaIdentity = await prisma.identityProfile.create({
    data: {
      userId: asma.id,
      name: "Asma Tech",
      slug: "asma-tech",
      type: "STARTUP",
      bio: "Startup SaaS B2B. On développe des outils d'automatisation pour les équipes marketing et commerciales.",
      headline: "SaaS Automation — Marketing & Sales Tools",
    },
  });

  const asmaCapsule1 = await prisma.capsule.create({
    data: {
      identityId: asmaIdentity.id,
      title: "Automatisez votre business",
      objective: "Quel est votre plus grand défi ?",
    },
  });

  const asmaOptions1 = [
    {
      label: "Génération de leads",
      branch: {
        headline: "Des leads qualifiés en autopilote",
        description: "Notre outil scrape, enrichit et qualifie vos prospects automatiquement. Intégration CRM directe.",
        cta: "Essai gratuit 14 jours",
        proof: "500+ entreprises utilisent notre outil. +60% de leads qualifiés en moyenne.",
      },
    },
    {
      label: "Email marketing",
      branch: {
        headline: "Des campagnes qui convertissent",
        description: "Séquences d'emails automatisées, A/B testing, analytics avancés. Tout en un seul dashboard.",
        cta: "Démarrer gratuitement",
        proof: "Taux d'ouverture moyen : 42%. ROI moyen : x8.",
      },
    },
    {
      label: "Analytics & reporting",
      branch: {
        headline: "Visualisez vos performances",
        description: "Tableaux de bord en temps réel, rapports automatiques, alertes intelligentes. Connectez tous vos outils en un clic.",
        cta: "Voir la démo",
        proof: "Économisez 10h/semaine sur le reporting. 300+ intégrations.",
      },
    },
  ];

  for (const opt of asmaOptions1) {
    await prisma.capsuleOption.create({
      data: {
        capsuleId: asmaCapsule1.id,
        label: opt.label,
        branch: { create: opt.branch },
      },
    });
  }

  const asmaCapsule2 = await prisma.capsule.create({
    data: {
      identityId: asmaIdentity.id,
      title: "Rejoignez notre programme partenaire",
      objective: "Quel profil vous correspond ?",
    },
  });

  const asmaOptions2 = [
    {
      label: "Agence / Consultant",
      branch: {
        headline: "Programme partenaire agences",
        description: "Revendez nos outils à vos clients avec une commission de 30%. Formation, support dédié et co-branding.",
        cta: "Devenir partenaire",
        proof: "120+ agences partenaires. Revenus récurrents garantis.",
      },
    },
    {
      label: "Affilié / Influenceur",
      branch: {
        headline: "Gagnez en recommandant",
        description: "25% de commission récurrente sur chaque vente. Lien d'affiliation, dashboard de suivi, paiements mensuels.",
        cta: "Rejoindre le programme",
        proof: "Top affiliés gagnent 3000€+/mois. Paiement fiable et transparent.",
      },
    },
  ];

  for (const opt of asmaOptions2) {
    await prisma.capsuleOption.create({
      data: {
        capsuleId: asmaCapsule2.id,
        label: opt.label,
        branch: { create: opt.branch },
      },
    });
  }

  console.log("✅ Asma créée avec 2 capsules (3+2 options)");

  console.log("\n🎉 4 utilisateurs créés avec succès !");
  console.log("   Mohamed  → /capsule/mohamed-dev     (FREELANCER, 1 capsule)");
  console.log("   Ahmed    → /capsule/ahmed-studio     (AGENCY, 2 capsules)");
  console.log("   Ahlem    → /capsule/ahlem-creates    (CREATOR, 1 capsule)");
  console.log("   Asma     → /capsule/asma-tech        (STARTUP, 2 capsules)");
  console.log("\n   Mot de passe commun : Test1234");
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
