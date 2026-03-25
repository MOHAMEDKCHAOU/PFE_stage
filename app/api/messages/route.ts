import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// POST — visitor sends a message (public, no auth required)
export async function POST(req: NextRequest) {
  try {
    const { name, email, content, identityId } = await req.json();

    if (!name?.trim() || !email?.trim() || !content?.trim() || !identityId) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    if (content.trim().length > 2000) {
      return NextResponse.json({ error: "Message trop long (max 2000 caractères)" }, { status: 400 });
    }

    // Verify identity exists
    const identity = await prisma.identityProfile.findUnique({ where: { id: identityId } });
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

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("POST MESSAGE ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET — authenticated user gets messages for their identities
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const messages = await prisma.message.findMany({
      where: {
        identity: { userId },
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
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { id, isRead } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    // Verify ownership
    const message = await prisma.message.findUnique({
      where: { id },
      include: { identity: { select: { userId: true } } },
    });
    if (!message || message.identity.userId !== userId) {
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
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const message = await prisma.message.findUnique({
      where: { id },
      include: { identity: { select: { userId: true } } },
    });
    if (!message || message.identity.userId !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.message.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE MESSAGE ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
