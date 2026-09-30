import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { clientIp, createPublicLead } from "@/lib/leads";
import { checkRateLimit } from "@/lib/rate-limit-memory";
import { canManageIdentityAsOwner, getManagedUserIdsForViewer } from "@/lib/studio-access";
import { NextRequest, NextResponse } from "next/server";

// POST — visitor sends a message (public, no auth required)
export async function POST(req: NextRequest) {
  try {
    const { name, email, content, identityId, website } = await req.json();

    // Champ piège invisible pour un humain : faux succès pour les robots.
    if (typeof website === "string" && website.trim() !== "") {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const limited = checkRateLimit(`message-create:${clientIp(req)}`, 8, 60 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Trop de messages envoyés. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) } },
      );
    }

    if (typeof name !== "string" || typeof email !== "string" || typeof content !== "string" || typeof identityId !== "string") {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }
    if (!name.trim() || !email.trim() || !content.trim() || !identityId) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    if (content.trim().length > 2000) {
      return NextResponse.json({ error: "Message trop long (max 2000 caractères)" }, { status: 400 });
    }

    // Verify identity exists (include userId for notification)
    const identity = await prisma.identityProfile.findUnique({
      where: { id: identityId },
      select: { id: true, userId: true, name: true },
    });
    if (!identity) {
      return NextResponse.json({ error: "Identité introuvable" }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        content: content.trim(),
        identityId,
      },
    });

    // Create notification for identity owner
    await prisma.notification.create({
      data: {
        userId: identity.userId,
        type: "NEW_MESSAGE",
        title: "💬 Nouveau message",
        body: `${name.trim()} vous a envoyé un message sur ${identity.name}`,
        link: "/dashboard/messages",
      },
    }).catch(() => {});

    // Chaque prise de contact entre aussi dans le pipeline Leads (fusionnée si déjà connue).
    await createPublicLead({
      identityId,
      name,
      email,
      message: content,
      source: "CONTACT_FORM",
      messageId: message.id,
    }).catch((e) => console.error("LEAD FROM MESSAGE", e));

    return NextResponse.json({ ok: true, id: message.id }, { status: 201 });
  } catch (error) {
    console.error("POST MESSAGE ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET — authenticated user gets messages for their identities
export async function GET() {
  try {
    const auth = await requirePermission("messages:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const ownerIds = await getManagedUserIdsForViewer(userId);
    const messages = await prisma.message.findMany({
      where: {
        identity: { userId: { in: ownerIds } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        identity: {
          select: { name: true, slug: true, type: true },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH — mark message as read/unread
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requirePermission("messages:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const { id, isRead } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    // Verify ownership
    const message = await prisma.message.findUnique({
      where: { id },
      include: { identity: { select: { userId: true } } },
    });
    if (!message || !(await canManageIdentityAsOwner(userId, message.identity.userId))) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { isRead: typeof isRead === "boolean" ? isRead : true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH MESSAGE ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — delete a message
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requirePermission("messages:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const message = await prisma.message.findUnique({
      where: { id },
      include: { identity: { select: { userId: true } } },
    });
    if (!message || !(await canManageIdentityAsOwner(userId, message.identity.userId))) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.message.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE MESSAGE ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
