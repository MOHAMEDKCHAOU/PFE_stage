/**
 * Crée ou met à jour un compte administrateur (idempotent).
 * Usage: node prisma/ensure-admin.js
 * Optionnel: ADMIN_EMAIL=... ADMIN_PASSWORD=... (changer le mot de passe après la 1ʳᵉ connexion en prod)
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@faymoos.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin1234";
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", password: hash },
    create: {
      email,
      password: hash,
      role: "ADMIN",
    },
    select: { id: true, email: true, role: true },
  });

  console.log("Compte admin prêt :");
  console.log("  Email   :", user.email);
  console.log("  Rôle    :", user.role);
  console.log("  Mot de passe (tel que fourni pour ce run) :", password);
  console.log("");
  console.log("Connexion : /login");
  console.log("Admin     : /dashboard/admin");
  console.log("Utilisateurs (rôles, dont AFFILIATE) : /dashboard/admin/users");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
