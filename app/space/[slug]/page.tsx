import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SmartSpaceViewer } from "@/components/SmartSpaceViewer";

export default async function PublicSmartSpacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const space = await prisma.smartSpace.findFirst({
    where: { slug, status: { in: ["READY", "PUBLISHED"] } },
    include: { identity: { select: { name: true, headline: true } }, scenes: { orderBy: { sortOrder: "asc" }, include: { hotspots: true } } },
  });
  if (!space) notFound();
  const scene = space.scenes.find((item) => item.panoramaUrl) || space.scenes[0];
  if (!scene?.panoramaUrl) notFound();
  return <main className="min-h-screen bg-[#0B0D10] px-4 py-8 text-[#F7F4EE] sm:px-8"><div className="mx-auto max-w-7xl"><div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[.18em] text-[#C6A15B]">360 Smart Space</p><h1 className="mt-2 text-3xl font-semibold">{space.title}</h1><p className="mt-1 text-sm text-white/45">by {space.identity.name}{space.identity.headline ? ` · ${space.identity.headline}` : ""}</p></div><span className="text-xs text-white/30">Powered by Faymoos</span></div><SmartSpaceViewer panoramaUrl={scene.panoramaUrl} hotspots={scene.hotspots}/></div></main>;
}
