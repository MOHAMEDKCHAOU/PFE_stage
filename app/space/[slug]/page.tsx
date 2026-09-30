import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { SmartSpaceViewer } from "@/components/SmartSpaceViewer";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

/** Public : uniquement PUBLISHED. Le propriétaire connecté peut prévisualiser un Space READY. */
async function loadVisibleSpace(slug: string) {
  const space = await prisma.smartSpace.findFirst({
    where: { slug, status: { in: ["READY", "PUBLISHED"] } },
    include: { identity: { select: { name: true, headline: true } }, scenes: { orderBy: { sortOrder: "asc" }, include: { hotspots: true } } },
  });
  if (!space) return null;
  if (space.status === "PUBLISHED") return { space, preview: false };
  const viewerId = await getUserId();
  return viewerId === space.userId ? { space, preview: true } : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const visible = await loadVisibleSpace(slug);
  if (!visible) return { title: "Smart Space — Faymoos" };
  return {
    title: `${visible.space.title} — Faymoos`,
    ...(visible.preview ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function PublicSmartSpacePage({ params }: PageProps) {
  const { slug } = await params;
  const visible = await loadVisibleSpace(slug);
  if (!visible) notFound();
  const { space, preview } = visible;
  const scene = space.scenes.find((item) => item.panoramaUrl) || space.scenes[0];
  if (!scene?.panoramaUrl) notFound();
  return <main className="min-h-screen bg-[#0B0D10] px-4 py-8 text-[#F7F4EE] sm:px-8"><div className="mx-auto max-w-7xl">
    {preview && <div role="status" className="mb-6 flex flex-col gap-2 rounded-2xl border border-[#C6A15B]/35 bg-[#C6A15B]/[.08] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span><strong className="text-[#E2C68E]">Aperçu privé</strong> <span className="text-white/60">— ce Space n’est pas publié : vous seul pouvez le voir.</span></span><Link href="/dashboard/spaces" className="text-[#C6A15B]">Publier depuis Smart Spaces →</Link></div>}
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[.18em] text-[#C6A15B]">360 Smart Space</p><h1 className="mt-2 text-3xl font-semibold">{space.title}</h1><p className="mt-1 text-sm text-white/45">by {space.identity.name}{space.identity.headline ? ` · ${space.identity.headline}` : ""}</p></div><span className="text-xs text-white/30">Powered by Faymoos</span></div>
    <SmartSpaceViewer panoramaUrl={scene.panoramaUrl} hotspots={scene.hotspots}/>
  </div></main>;
}
