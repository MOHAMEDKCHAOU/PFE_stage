/**
 * Create or repair the Faymoos security-owner account (idempotent).
 * Usage: npm run admin:ensure
 * Recommended: ADMIN_EMAIL=... ADMIN_PASSWORD=...
 *
 * Security rule: running this command again without ADMIN_PASSWORD does NOT
 * reset an existing administrator password. Production requires an explicit
 * ADMIN_PASSWORD when the account has to be created.
 */
const { PrismaClient } = require("../src/generated/prisma");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@faymoos.com").trim().toLowerCase();
  const explicitPassword = process.env.ADMIN_PASSWORD?.trim();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing && process.env.NODE_ENV === "production" && !explicitPassword) {
    throw new Error(
      "ADMIN_PASSWORD is required when creating the initial SUPER_ADMIN in production.",
    );
  }

  const initialPassword = explicitPassword || "Admin1234";
  let passwordChanged = false;
  let created = false;

  let user;
  if (existing) {
    const update = { role: "SUPER_ADMIN", status: "ACTIVE" };
    if (explicitPassword) {
      update.password = await bcrypt.hash(explicitPassword, 12);
      passwordChanged = true;
    }
    user = await prisma.user.update({
      where: { email },
      data: update,
      select: { id: true, email: true, role: true, status: true },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(initialPassword, 12),
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
      select: { id: true, email: true, role: true, status: true },
    });
    created = true;
  }

  console.log("Compte de sécurité Faymoos prêt :");
  console.log("  Email  :", user.email);
  console.log("  Rôle   :", user.role);
  console.log("  Statut :", user.status);
  if (created || passwordChanged) {
    console.log("  Mot de passe défini pour ce run :", initialPassword);
  } else {
    console.log("  Mot de passe : inchangé (ADMIN_PASSWORD non fourni)");
  }
  console.log("");
  console.log("Connexion              : /login");
  console.log("Administration         : /dashboard/admin");
  console.log("Utilisateurs & RBAC    : /dashboard/admin/users");
  console.log("Access control / audit : /dashboard/admin/access");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
