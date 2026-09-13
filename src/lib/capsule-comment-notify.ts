import { prisma } from "@/lib/prisma";

const NOTIF_TYPE = "NEW_CAPSULE_COMMENT";

export async function notifyOwnerNewCapsuleComment(args: {
  ownerUserId: string;
  capsuleId: string;
  capsuleTitle: string;
  identitySlug: string;
  authorName: string;
  preview: string;
}) {
  const { ownerUserId, capsuleId, capsuleTitle, identitySlug, authorName, preview } = args;
  const link = `/dashboard/capsule-comments?capsuleId=${encodeURIComponent(capsuleId)}`;
  await prisma.notification.create({
    data: {
      userId: ownerUserId,
      type: NOTIF_TYPE,
      title: "Nouveau commentaire sur une capsule",
      body: `${authorName} sur « ${capsuleTitle} » — ${preview.slice(0, 80)}${preview.length > 80 ? "…" : ""}`,
      link,
    },
  });

  const resend = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const owner = await prisma.user.findUnique({ where: { id: ownerUserId }, select: { email: true } });
  if (resend && from && owner?.email && process.env.COMMENT_NOTIFY_EMAIL !== "false") {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resend}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: owner.email,
          subject: `[Faymoos] Nouveau commentaire — ${capsuleTitle}`,
          html: `<p><strong>${authorName}</strong> a commenté votre capsule <strong>${capsuleTitle}</strong>.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}${link}">Modérer dans le dashboard</a></p>
            <p style="color:#666;font-size:12px;">Profil public : /capsule/${identitySlug}</p>`,
        }),
      });
    } catch {
      /* non bloquant */
    }
  }
}
