import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertCanCreateIdentity } from "@/lib/subscription-guards";
import { syncAutoBadgesForUser } from "@/lib/faymoos-badges";
import { canManageIdentityAsOwner, getManagedUserIdsForViewer, isAffiliateForClient } from "@/lib/studio-access";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const ownerIds = await getManagedUserIdsForViewer(userId);
    const identities = await prisma.identityProfile.findMany({
      where: { userId: { in: ownerIds } },
      include: {
        portfolioProjects: true,
        testimonials: true,
        capsules: {
          include: { options: { include: { branch: true } } },
        },
      },
    });
    return NextResponse.json(identities);
  } catch (error) {
    console.error("GET IDENTITY ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { name, type, bio, headline, avatar, cover, theme, socialLinks, clientUserId } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Le nom et le type sont requis" }, { status: 400 });
    }

    let ownerUserId = userId;
    if (clientUserId && clientUserId !== userId) {
      const actor = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (actor?.role !== "AFFILIATE") {
        return NextResponse.json({ error: "Seul un compte Studio peut créer pour un client" }, { status: 403 });
      }
      const ok = await isAffiliateForClient(userId, clientUserId);
      if (!ok) {
        return NextResponse.json({ error: "Client non lié à votre Studio" }, { status: 403 });
      }
      ownerUserId = clientUserId;
    }

    const quota = await assertCanCreateIdentity(userId, ownerUserId);
    if (quota) {
      return NextResponse.json({ error: quota.error }, { status: quota.status });
    }

    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const slug = `${slugBase}-${Date.now()}`;

    const identity = await prisma.identityProfile.create({
      data: {
        userId: ownerUserId,
        name,
        slug,
        type,
        bio,
        headline,
        avatar,
        cover,
        theme,
        socialLinks: socialLinks || undefined,
      },
    });
    return NextResponse.json(identity, { status: 201 });
  } catch (error) {
    console.error("POST IDENTITY ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const {
      id,
      name,
      type,
      bio,
      headline,
      avatar,
      cover,
      theme,
      socialLinks,
      hideBranding,
      ctaWebhookUrl,
      ctaWebhookSecret,
    } = body;

    if (!id) return NextResponse.json({ error: "L'ID de l'identité est requis" }, { status: 400 });

    const existing = await prisma.identityProfile.findUnique({ where: { id } });
    if (!existing || !(await canManageIdentityAsOwner(userId, existing.userId))) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    const identity = await prisma.identityProfile.update({
      where: { id },
      data: {
        name,
        type,
        bio,
        headline,
        avatar,
        cover,
        theme,
        socialLinks: socialLinks !== undefined ? socialLinks : undefined,
        ...(typeof hideBranding === "boolean" ? { hideBranding } : {}),
        ...(ctaWebhookUrl !== undefined
          ? {
              ctaWebhookUrl:
                typeof ctaWebhookUrl === "string" && ctaWebhookUrl.trim() !== "" ? ctaWebhookUrl.trim() : null,
            }
          : {}),
        ...(ctaWebhookSecret !== undefined
          ? {
              ctaWebhookSecret:
                typeof ctaWebhookSecret === "string" && ctaWebhookSecret.trim() !== ""
                  ? ctaWebhookSecret
                  : null,
            }
          : {}),
      },
    });
    await syncAutoBadgesForUser(existing.userId);
    return NextResponse.json(identity);
  } catch (error) {
    console.error("PUT IDENTITY ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Le paramètre id est requis" }, { status: 400 });
    }

    const existing = await prisma.identityProfile.findUnique({ where: { id } });
    if (!existing || !(await canManageIdentityAsOwner(userId, existing.userId))) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    await prisma.identityProfile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE IDENTITY ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
