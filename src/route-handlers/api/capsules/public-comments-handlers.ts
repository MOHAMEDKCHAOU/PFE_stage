import { prisma } from "@/lib/prisma";
import { notifyOwnerNewCapsuleComment } from "@/lib/capsule-comment-notify";
import { checkRateLimit } from "@/lib/rate-limit-memory";
import { NextResponse } from "next/server";

const COMMENT_POST_LIMIT = 20;
const COMMENT_POST_WINDOW_MS = 60 * 60 * 1000;

function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/** GET — commentaires approuvés uniquement (pas d’email exposé) */
export async function getPublicCapsuleComments(capsuleId: string) {
  const capsule = await prisma.capsule.findUnique({
    where: { id: capsuleId },
    select: {
      commentsEnabled: true,
      isPublished: true,
      title: true,
      identity: { select: { slug: true } },
    },
  });

  if (!capsule || !capsule.isPublished) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (!capsule.commentsEnabled) {
    return NextResponse.json({ error: "Commentaires désactivés" }, { status: 403 });
  }

  const roots = await prisma.capsuleComment.findMany({
    where: {
      capsuleId,
      status: "APPROVED",
      parentId: null,
      isOwnerReply: false,
    },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      authorName: true,
      body: true,
      createdAt: true,
      children: {
        where: { status: "APPROVED", isOwnerReply: true },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true, authorName: true, body: true, createdAt: true },
      },
    },
  });

  const totalApproved = await prisma.capsuleComment.count({
    where: {
      capsuleId,
      status: "APPROVED",
      parentId: null,
      isOwnerReply: false,
    },
  });

  return NextResponse.json({
    totalApproved,
    items: roots.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      reply: r.children[0]
        ? {
            id: r.children[0].id,
            authorName: r.children[0].authorName,
            body: r.children[0].body,
            createdAt: r.children[0].createdAt.toISOString(),
          }
        : null,
    })),
  });
}

/** POST — nouveau commentaire visiteur (PENDING) */
export async function postPublicCapsuleComment(req: Request, capsuleId: string) {
  const capsule = await prisma.capsule.findUnique({
    where: { id: capsuleId },
    select: {
      commentsEnabled: true,
      isPublished: true,
      title: true,
      identity: { select: { userId: true, slug: true, name: true } },
    },
  });

  if (!capsule?.isPublished || !capsule.commentsEnabled) {
    return NextResponse.json({ error: "Commentaires fermés pour cette capsule." }, { status: 403 });
  }

  const key = `capsule-comment:${capsuleId}:${clientKey(req)}`;
  const limited = checkRateLimit(key, COMMENT_POST_LIMIT, COMMENT_POST_WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de commentaires envoyés. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) } },
    );
  }

  let body: { authorName?: unknown; authorEmail?: unknown; body?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const authorName = typeof body.authorName === "string" ? body.authorName.trim() : "";
  const authorEmail =
    typeof body.authorEmail === "string" && body.authorEmail.trim() !== ""
      ? body.authorEmail.trim()
      : null;
  const text = typeof body.body === "string" ? body.body.trim() : "";

  if (authorName.length < 2 || authorName.length > 120) {
    return NextResponse.json({ error: "Indiquez un nom (2 à 120 caractères)." }, { status: 400 });
  }
  if (text.length < 3 || text.length > 2000) {
    return NextResponse.json({ error: "Message entre 3 et 2000 caractères." }, { status: 400 });
  }
  if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    return NextResponse.json({ error: "E-mail invalide." }, { status: 400 });
  }

  const row = await prisma.capsuleComment.create({
    data: {
      capsuleId,
      authorName,
      authorEmail,
      body: text,
      status: "PENDING",
      isOwnerReply: false,
    },
    select: { id: true, createdAt: true },
  });

  await notifyOwnerNewCapsuleComment({
    ownerUserId: capsule.identity.userId,
    capsuleId,
    capsuleTitle: capsule.title,
    identitySlug: capsule.identity.slug,
    authorName,
    preview: text,
  });

  return NextResponse.json({
    ok: true,
    message:
      "Merci ! Votre commentaire a été transmis. Il sera visible après validation par le créateur.",
    id: row.id,
  });
}
