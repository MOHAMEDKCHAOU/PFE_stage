import { writeAuditLog } from "@/lib/audit";
import { createAuthSession, setAuthCookie } from "@/lib/auth";
import { permissionsForRole, ROLE_DEFINITIONS, normalizeRole } from "@/lib/rbac-policy";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { identityProfiles: true },
    });

    // Deliberately use one generic credential error to avoid account enumeration.
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Ce compte est suspendu. Contactez un administrateur." },
        { status: 403 },
      );
    }

    const { token, expiresAt } = await createAuthSession(user.id);
    await setAuthCookie(token, expiresAt);

    const role = normalizeRole(user.role);
    await writeAuditLog({
      actorUserId: user.id,
      action: "AUTH_LOGIN",
      targetType: "User",
      targetId: user.id,
    });

    const { password: passwordHash, ...safeUser } = user;
    void passwordHash;

    return NextResponse.json({
      message: "Connexion réussie",
      user: {
        ...safeUser,
        role,
        roleLabel: ROLE_DEFINITIONS[role].label,
        permissions: permissionsForRole(role),
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
