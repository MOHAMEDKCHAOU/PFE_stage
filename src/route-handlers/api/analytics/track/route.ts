import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";
import { NextResponse } from "next/server";

function dispatchCtaWebhook(args: {
  url: string;
  secret: string | null;
  payload: Record<string, unknown>;
}) {
  const body = JSON.stringify(args.payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Faymoos-Webhook/1.0",
  };
  if (args.secret) {
    const sig = createHmac("sha256", args.secret).update(body).digest("hex");
    headers["X-Faymoos-Signature"] = `sha256=${sig}`;
  }
  void fetch(args.url, { method: "POST", headers, body }).catch(() => {});
}

// POST /api/analytics/track — Public (called by capsule visitors)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, capsuleId, sessionId, optionId, optionLabel } = body;

    if (!action || !capsuleId) {
      return NextResponse.json({ error: "action et capsuleId requis" }, { status: 400 });
    }

    const capsule = await prisma.capsule.findUnique({
      where: { id: capsuleId },
      include: {
        identity: {
          select: {
            userId: true,
            name: true,
            slug: true,
            id: true,
            ctaWebhookUrl: true,
            ctaWebhookSecret: true,
          },
        },
      },
    });
    if (!capsule) {
      return NextResponse.json({ error: "Capsule introuvable" }, { status: 404 });
    }

    if (action === "START") {
      const session = await prisma.capsuleSession.create({
        data: {
          capsuleId,
          events: {
            create: {
              type: "START",
              value: null,
            },
          },
        },
      });
      return NextResponse.json({ sessionId: session.id }, { status: 201 });
    }

    if (
      (action === "OPTION_CLICK" || action === "CTA_CLICK") &&
      sessionId
    ) {
      const session = await prisma.capsuleSession.findUnique({
        where: { id: sessionId },
      });
      if (!session) {
        return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
      }

      const event = await prisma.capsuleEvent.create({
        data: {
          sessionId,
          type: action,
          value:
            action === "OPTION_CLICK"
              ? optionLabel || optionId || null
              : optionLabel || null,
        },
      });

      if (action === "CTA_CLICK") {
        await prisma.capsuleSession.update({
          where: { id: sessionId },
          data: { endedAt: new Date() },
        });

        await prisma.notification
          .create({
            data: {
              userId: capsule.identity.userId,
              type: "CTA_CLICK",
              title: "🎯 Clic sur votre CTA",
              body: `Un visiteur a cliqué sur le CTA de votre capsule "${capsule.title}" (option: ${optionLabel || "inconnue"})`,
              link: "/dashboard/analytics",
            },
          })
          .catch(() => {});

        const hook = capsule.identity.ctaWebhookUrl?.trim();
        if (hook && /^https:\/\//i.test(hook)) {
          dispatchCtaWebhook({
            url: hook,
            secret: capsule.identity.ctaWebhookSecret,
            payload: {
              event: "cta_click",
              capsuleId: capsule.id,
              capsuleTitle: capsule.title,
              identityId: capsule.identity.id,
              identitySlug: capsule.identity.slug,
              optionLabel: optionLabel ?? null,
              sessionId,
              eventId: event.id,
              occurredAt: new Date().toISOString(),
            },
          });
        }
      }

      return NextResponse.json({ eventId: event.id }, { status: 201 });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    console.error("TRACK ANALYTICS ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
