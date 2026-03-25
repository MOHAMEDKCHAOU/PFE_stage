const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  // 1. Create a demo user
  const hashedPassword = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.create({
    data: {
      email: "demo@faymoos.com",
      password: hashedPassword,
    },
  });

  console.log("✅ User created:", user.email);

  // 2. Create an identity profile
  const identity = await prisma.identityProfile.create({
    data: {
      userId: user.id,
      name: "Faymoos Studio",
      slug: "faymoos-studio",
      type: "FREELANCER",
      bio: "We build digital experiences that convert visitors into clients.",
      headline: "Digital Studio — Web, Brand & Strategy",
    },
  });

  console.log("✅ Identity created:", identity.slug);

  // 3. Create a capsule
  const capsule = await prisma.capsule.create({
    data: {
      identityId: identity.id,
      title: "Let's work together",
      objective: "What do you need?",
    },
  });

  console.log("✅ Capsule created:", capsule.title);

  // 4. Create options + branches
  const options = [
    {
      label: "Build a website",
      branch: {
        headline: "Custom websites that convert",
        description:
          "We design and develop high-performance websites tailored to your brand. From landing pages to full platforms — responsive, fast, and built to grow with you.",
        cta: "Book a free call",
        proof: "200+ websites delivered. Average +40% conversion rate for our clients.",
      },
    },
    {
      label: "Design a logo",
      branch: {
        headline: "A brand identity that sticks",
        description:
          "Your logo is the first impression. We craft unique, memorable brand identities that tell your story and stand out in any market.",
        cta: "See our portfolio",
        proof: "150+ brand identities created for startups and established businesses.",
      },
    },
    {
      label: "Get a consultation",
      branch: {
        headline: "Strategy session — 1 on 1",
        description:
          "Not sure where to start? Book a 30-minute strategy call. We'll analyze your current situation and map out the best next steps for your project.",
        cta: "Schedule now",
        proof: "Rated 4.9/5 by 80+ clients on strategy sessions.",
      },
    },
  ];

  for (const opt of options) {
    const option = await prisma.capsuleOption.create({
      data: {
        capsuleId: capsule.id,
        label: opt.label,
        branch: {
          create: {
            headline: opt.branch.headline,
            description: opt.branch.description,
            cta: opt.branch.cta,
            proof: opt.branch.proof,
          },
        },
      },
      include: { branch: true },
    });
    console.log("✅ Option + Branch:", option.label, "→", option.branch?.headline);
  }

  console.log("\n🎉 Seed complete! Visit: /capsule/faymoos-studio");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
