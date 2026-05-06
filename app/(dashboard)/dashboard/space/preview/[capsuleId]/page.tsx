import { getPublicBadgePayloadForUser } from "@/lib/faymoos-badges";
import { parseTagsFromJson } from "@/lib/identity-profession";
import { prisma } from "@/lib/prisma";
import { resolvePublicHideBranding } from "@/lib/subscription-entitlements";
import { loadBillingUser } from "@/lib/subscription-guards";
import { canManageIdentityAsOwner } from "@/lib/studio-access";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CapsuleViewer } from "../../../../../capsule/[slug]/CapsuleViewer";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ capsuleId: string }> };

export default async function SpacePreviewPage({ params }: PageProps) {
  const { capsuleId } = await params;
  const cookieStore = await cookies();
  const session = cookieStore.get("faymoos_session");
  if (!session?.value) redirect("/login");

  const userId = session.value;

  const cap = await prisma.capsule.findUnique({
    where: { id: capsuleId },
    include: {
      identity: true,
      options: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { branch: true },
      },
    },
  });

  if (!cap || !(await canManageIdentityAsOwner(userId, cap.identity.userId))) notFound();

  const [projects, testimonials, badges] = await Promise.all([
    prisma.portfolioProject.findMany({
      where: { identityId: cap.identityId, isPublic: true },
      take: 6,
    }),
    prisma.testimonial.findMany({ where: { identityId: cap.identityId }, take: 4 }),
    getPublicBadgePayloadForUser(cap.identity.userId).catch(() => null),
  ]);

  const identity = cap.identity;

  const ownerBilling = await loadBillingUser(identity.userId);
  const hideBrandingEffective =
    ownerBilling != null && resolvePublicHideBranding(identity.hideBranding, ownerBilling);

  return (
    <main className="theme-capsule min-h-screen bg-zinc-950 text-white">
      <div className="border-b border-white/10 bg-black/30 px-4 py-2 text-center text-xs text-amber-200/90">
        Aperçu éditeur (brouillon autorisé) — la version publique sur /capsule/[slug] n’affiche que les
        capsules publiées.
      </div>
      <CapsuleViewer
        hideBranding={hideBrandingEffective}
        identitySlug={identity.slug}
        badges={badges}
        identity={{
          id: identity.id,
          name: identity.name,
          headline: identity.headline,
          bio: identity.bio,
          avatar: identity.avatar,
          cover: identity.cover,
          type: identity.type,
          theme: identity.theme,
          socialLinks: identity.socialLinks as Record<string, string> | null,
          profession: identity.profession,
          tags: parseTagsFromJson(identity.tags),
        }}
        capsules={[
          {
            id: cap.id,
            title: cap.title,
            objective: cap.objective,
            commentsEnabled: cap.commentsEnabled,
            options: cap.options.map((opt) => ({
              id: opt.id,
              label: opt.label,
              branch: opt.branch
                ? {
                    headline: opt.branch.headline,
                    description: opt.branch.description,
                    cta: opt.branch.cta,
                    proof: opt.branch.proof,
                  }
                : null,
            })),
          },
        ]}
        projects={projects.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          image: p.image,
          year: p.year,
        }))}
        testimonials={testimonials.map((t) => ({
          id: t.id,
          author: t.author,
          content: t.content,
          role: t.role,
          company: t.company,
        }))}
      />
    </main>
  );
}
