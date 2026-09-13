import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { canManageIdentityAsOwner } from "@/lib/studio-access";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const auth = await requirePermission("testimonials:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const { searchParams } = new URL(req.url);
    const identityId = searchParams.get("identityId");
    if (!identityId) return NextResponse.json({ error: "identityId requis" }, { status: 400 });

    const identity = await prisma.identityProfile.findUnique({ where: { id: identityId } });
    if (!identity || !(await canManageIdentityAsOwner(userId, identity.userId))) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    const testimonials = await prisma.testimonial.findMany({
      where: { identityId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("GET TESTIMONIALS ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requirePermission("testimonials:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const body = await req.json();
    const { identityId, author, content, role, company } = body;

    if (!identityId || !author || !content) {
      return NextResponse.json({ error: "identityId, author et content sont requis" }, { status: 400 });
    }

    const identity = await prisma.identityProfile.findUnique({ where: { id: identityId } });
    if (!identity || !(await canManageIdentityAsOwner(userId, identity.userId))) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        identityId,
        author,
        content,
        role: role || null,
        company: company || null,
      },
    });
    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    console.error("POST TESTIMONIAL ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requirePermission("testimonials:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const body = await req.json();
    const { id, author, content, role, company } = body;

    if (!id) return NextResponse.json({ error: "L'ID du témoignage est requis" }, { status: 400 });

    const testimonial = await prisma.testimonial.findUnique({
      where: { id },
      include: { identity: true },
    });
    if (!testimonial || !(await canManageIdentityAsOwner(userId, testimonial.identity.userId))) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    const updated = await prisma.testimonial.update({
      where: { id },
      data: {
        author: author ?? testimonial.author,
        content: content ?? testimonial.content,
        role: role !== undefined ? role : testimonial.role,
        company: company !== undefined ? company : testimonial.company,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT TESTIMONIAL ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requirePermission("testimonials:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "L'ID du témoignage est requis" }, { status: 400 });

    const testimonial = await prisma.testimonial.findUnique({
      where: { id },
      include: { identity: true },
    });
    if (!testimonial || !(await canManageIdentityAsOwner(userId, testimonial.identity.userId))) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Témoignage supprimé" });
  } catch (error) {
    console.error("DELETE TESTIMONIAL ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
