import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, type, bio } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const finalName = name || normalizedEmail.split("@")[0];
    const finalType = type || "USER";
    const finalRole = "USER";
    const slugBase = finalName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const slug = `${slugBase}-${Date.now()}`;

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role: finalRole,
        identityProfiles: {
          create: {
            name: finalName,
            slug,
            type: finalType,
            bio: bio || null,
          },
        },
      },
      include: { identityProfiles: true },
    });

    // Ne jamais retourner le mot de passe hashé
    const { password: storedHash, ...userWithoutPassword } = user;
    void storedHash;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
