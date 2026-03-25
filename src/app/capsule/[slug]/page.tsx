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
        include: {
          options: {
            include: {
              branch: true,
            },
          },
        },
      },
    },
  });

  if (!identity || identity.capsules.length === 0) {
    notFound();
  }

  // Use the first capsule for this page
  const capsule = identity.capsules[0];

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-12">
      <CapsuleViewer
        identity={{
          name: identity.name,
          headline: identity.headline,
          avatar: identity.avatar,
        }}
        capsule={{
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
        }}
      />
    </main>
  );
}
