import { getPublicBadgePayloadForUser } from "@/lib/faymoos-badges";
import { parseTagsFromJson } from "@/lib/identity-profession";
import { prisma } from "@/lib/prisma";
import { resolvePublicHideBranding } from "@/lib/subscription-entitlements";
import { loadBillingUser } from "@/lib/subscription-guards";
import { notFound } from "next/navigation";
import { CapsuleViewer } from "./CapsuleViewer";

type CapsulePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CapsulePage({ params }: CapsulePageProps) {
  const { slug } = await params;

  const identity = await prisma.identityProfile.findUnique({
    where: { slug },
    include: {
      capsules: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        include: {
          options: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            include: {
              branch: true,
            },
          },
        },
      },
      portfolioProjects: { where: { isPublic: true }, take: 6 },
      testimonials: { take: 4 },
    },
  });

  if (!identity || identity.capsules.length === 0) {
    notFound();
  }

  let badges = null;
  try {
    badges = await getPublicBadgePayloadForUser(identity.userId);
  } catch {
    badges = null;
  }

  const ownerBilling = await loadBillingUser(identity.userId);
  const hideBrandingEffective =
    ownerBilling != null && resolvePublicHideBranding(identity.hideBranding, ownerBilling);

  return (
    <main className="theme-capsule min-h-screen bg-zinc-950 text-white">
      <CapsuleViewer
        hideBranding={hideBrandingEffective}
        identitySlug={slug}
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
        capsules={identity.capsules.map((capsule) => ({
          id: capsule.id,
          title: capsule.title,
          objective: capsule.objective,
          commentsEnabled: capsule.commentsEnabled,
          options: capsule.options.map((opt) => ({
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
        }))}
        projects={identity.portfolioProjects.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          image: p.image,
          year: p.year,
        }))}
        testimonials={identity.testimonials.map((t) => ({
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
