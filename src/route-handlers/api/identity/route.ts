import { requirePermission } from "@/lib/auth";
import { normalizeProfession, normalizeTagsInput } from "@/lib/identity-profession";
import { prisma } from "@/lib/prisma";
import { canHidePlatformBranding } from "@/lib/subscription-entitlements";
import { assertCanCreateIdentity, loadBillingUser } from "@/lib/subscription-guards";
import { syncAutoBadgesForUser } from "@/lib/faymoos-badges";
import { hasPermission } from "@/lib/rbac-policy";
import { canManageIdentityAsOwner, getManagedUserIdsForViewer, isAffiliateForClient } from "@/lib/studio-access";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requirePermission("identity:read");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

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

    const uniqueOwners = [...new Set(identities.map((i) => i.userId))];
    const owners =
      uniqueOwners.length === 0
        ? []
        : await prisma.user.findMany({
            where: { id: { in: uniqueOwners } },
            select: {
              id: true,
              role: true,
              stripeCustomerId: true,
              stripeSubscriptionId: true,
              subscriptionStatus: true,
              subscriptionPlan: true,
              currentPeriodEnd: true,
            },
          });
    const billingByOwner = new Map(owners.map((u) => [u.id, u]));

    const payload = identities.map((row) => {
      const b = billingByOwner.get(row.userId);
      return {
        ...row,
        ownerCanHideBranding: b ? canHidePlatformBranding(b) : false,
      };
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET IDENTITY ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requirePermission("identity:create");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const body = await req.json();
    const {
      name,
      type,
      bio,
      headline,
      avatar,
      cover,
      theme,
      socialLinks,
      profession: professionRaw,
      tags: tagsRaw,
      clientUserId,
    } = body;

    const professionNorm = normalizeProfession(professionRaw);
    const tagsNorm = normalizeTagsInput(tagsRaw);

    if (!name || !type) {
      return NextResponse.json({ error: "Le nom et le type sont requis" }, { status: 400 });
    }

    let ownerUserId = userId;
    if (clientUserId && clientUserId !== userId) {
      const actor = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!actor || !hasPermission(actor.role, "studio:clients:manage")) {
        return NextResponse.json({ error: "Seul un partenaire affilié peut créer une identité pour un client lié." }, { status: 403 });
      }
      const ok = await isAffiliateForClient(userId, clientUserId);
      if (!ok) {
        return NextResponse.json({ error: "Client non lié à votre espace commercial." }, { status: 403 });
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
        ...(professionNorm !== undefined ? { profession: professionNorm } : {}),
        ...(tagsNorm !== undefined ? { tags: tagsNorm } : {}),
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
    const auth = await requirePermission("identity:update");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

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
      profession: professionRaw,
      tags: tagsRaw,
    } = body;

    const professionNorm = normalizeProfession(professionRaw);
    const tagsNorm = normalizeTagsInput(tagsRaw);

    if (!id) return NextResponse.json({ error: "L'ID de l'identité est requis" }, { status: 400 });

    const existing = await prisma.identityProfile.findUnique({ where: { id } });
    if (!existing || !(await canManageIdentityAsOwner(userId, existing.userId))) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    if (typeof hideBranding === "boolean") {
      const ownerBilling = await loadBillingUser(existing.userId);
      if (!ownerBilling) {
        return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      }
      if (hideBranding && !canHidePlatformBranding(ownerBilling)) {
        return NextResponse.json(
          {
            error:
              "Abonnement Pro, Commercial ou Commercial+ actif requis pour masquer le branding Faymoos sur les capsules publiques.",
          },
          { status: 403 },
        );
      }
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
        ...(professionNorm !== undefined ? { profession: professionNorm } : {}),
        ...(tagsNorm !== undefined ? { tags: tagsNorm } : {}),
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
    const auth = await requirePermission("identity:delete");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

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
