import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_DEFINITIONS } from "@/lib/rbac-policy";
import { getBillingSnapshotForUser } from "@/lib/subscription-guards";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const raw = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        identityProfiles: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            bio: true,
            headline: true,
            avatar: true,
            cover: true,
            theme: true,
            profession: true,
            tags: true,
            createdAt: true,
            hideBranding: true,
            ctaWebhookUrl: true,
            ctaWebhookSecret: true,
            _count: {
              select: {
                portfolioProjects: true,
                testimonials: true,
                capsules: true,
              },
            },
          },
        },
      },
    });

    if (!raw) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

    const billing = await getBillingSnapshotForUser(auth.userId);
    const user = {
      ...raw,
      role: auth.role,
      roleLabel: ROLE_DEFINITIONS[auth.role].label,
      permissions: auth.permissions,
      identityProfiles: raw.identityProfiles.map(({ ctaWebhookSecret, ...p }) => ({
        ...p,
        hasCtaWebhookSecret: !!ctaWebhookSecret,
      })),
      billing,
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET ME ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
