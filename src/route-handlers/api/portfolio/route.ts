import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { canManageIdentityAsOwner } from "@/lib/studio-access";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const auth = await requirePermission("portfolio:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const { searchParams } = new URL(req.url);
    const identityId = searchParams.get("identityId");
    if (!identityId) return NextResponse.json({ error: "identityId requis" }, { status: 400 });

    const identity = await prisma.identityProfile.findUnique({ where: { id: identityId } });
    if (!identity || !(await canManageIdentityAsOwner(userId, identity.userId))) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    const projects = await prisma.portfolioProject.findMany({
      where: { identityId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET PORTFOLIO ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requirePermission("portfolio:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const body = await req.json();
    const { identityId, title, description, image, year, isPublic } = body;

    if (!identityId || !title || !description) {
      return NextResponse.json({ error: "identityId, title et description sont requis" }, { status: 400 });
    }

    const identity = await prisma.identityProfile.findUnique({ where: { id: identityId } });
    if (!identity || !(await canManageIdentityAsOwner(userId, identity.userId))) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    const project = await prisma.portfolioProject.create({
      data: {
        identityId,
        title,
        description,
        image: image || null,
        year: year ? parseInt(year, 10) : null,
        isPublic: isPublic !== false,
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("POST PORTFOLIO ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requirePermission("portfolio:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const body = await req.json();
    const { id, title, description, image, year, isPublic } = body;

    if (!id) return NextResponse.json({ error: "L'ID du projet est requis" }, { status: 400 });

    const project = await prisma.portfolioProject.findUnique({
      where: { id },
      include: { identity: true },
    });
    if (!project || !(await canManageIdentityAsOwner(userId, project.identity.userId))) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    const updated = await prisma.portfolioProject.update({
      where: { id },
      data: {
        title: title ?? project.title,
        description: description ?? project.description,
        image: image !== undefined ? image : project.image,
        year: year !== undefined ? (year ? parseInt(year, 10) : null) : project.year,
        isPublic: isPublic !== undefined ? isPublic : project.isPublic,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT PORTFOLIO ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requirePermission("portfolio:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "L'ID du projet est requis" }, { status: 400 });

    const project = await prisma.portfolioProject.findUnique({
      where: { id },
      include: { identity: true },
    });
    if (!project || !(await canManageIdentityAsOwner(userId, project.identity.userId))) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    await prisma.portfolioProject.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Projet supprimé" });
  } catch (error) {
    console.error("DELETE PORTFOLIO ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
