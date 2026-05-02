import { prisma } from "@/lib/prisma";
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

  return (
    <main className="theme-capsule min-h-screen bg-zinc-950 text-white">
      <CapsuleViewer
        hideBranding={identity.hideBranding}
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
        }}
        capsules={identity.capsules.map((capsule) => ({
          id: capsule.id,
          title: capsule.title,
          objective: capsule.objective,
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
