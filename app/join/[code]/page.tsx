import type { Metadata } from "next";
import { JoinStudioClient } from "./JoinStudioClient";

export const metadata: Metadata = {
  title: "Rejoindre un partenaire — Faymoos",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ code: string }> };

export default async function JoinStudioPage({ params }: PageProps) {
  const { code } = await params;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0D10] px-4 py-12 text-[#F7F4EE]">
      <JoinStudioClient code={code} />
    </main>
  );
}
