"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Space = {
  id: string;
  title: string;
  slug: string;
  status: string;
  coverUrl?: string | null;
  identity: { name: string };
  scenes: Array<{ id: string; name: string; status: string; panoramaUrl?: string | null }>;
};

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/spaces")
      .then((r) => r.json())
      .then((d) => setSpaces(d.spaces || []))
      .finally(() => setLoading(false));
  }, []);

  async function setPublished(space: Space, publish: boolean) {
    setBusyId(space.id);
    setError("");
    const res = await fetch(`/api/spaces/${space.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: publish ? "PUBLISHED" : "READY" }),
    });
    const json = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Action impossible");
      return;
    }
    setSpaces((list) => list.map((s) => (s.id === space.id ? { ...s, status: json.space?.status ?? s.status } : s)));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[.18em] text-[#C6A15B]">360 Smart Space</p>
          <h1 className="mt-2 text-3xl font-semibold">Scan. Review. Publish.</h1>
          <p className="mt-2 max-w-xl text-sm text-white/50">
            Move the camera along the guide. Faymoos automatically chooses frames and sends them to the reconstruction
            service.
          </p>
        </div>
        <Link href="/dashboard/spaces/new" className="rounded-2xl bg-[#C6A15B] px-5 py-3 text-sm font-semibold text-[#0B0D10]">
          + New Smart Space
        </Link>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-white/40">Loading…</p>
      ) : spaces.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center">
          <h2 className="text-xl font-semibold">No Smart Space yet</h2>
          <p className="mt-2 text-sm text-white/45">Create one by simply following the camera target.</p>
          <Link href="/dashboard/spaces/new" className="mt-6 inline-block text-[#C6A15B]">
            Start my first scan →
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {spaces.map((s) => {
            const published = s.status === "PUBLISHED";
            const publishable = s.status === "READY" || published;
            return (
              <div key={s.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.035]">
                <div
                  className="aspect-video bg-white/5 bg-cover bg-center"
                  style={s.coverUrl ? { backgroundImage: `url("${encodeURI(s.coverUrl)}")` } : {}}
                />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold">{s.title}</h2>
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] ${
                        published ? "border-emerald-400/30 text-emerald-300" : "border-white/10 text-white/45"
                      }`}
                    >
                      {published ? "PUBLIC" : s.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    {s.identity.name} · {s.scenes.length} scene(s)
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
                    <Link href={`/space/${s.slug}`} className="text-[#C6A15B]">
                      {published ? "View public page" : "Private preview"}
                    </Link>
                    <Link href={`/dashboard/spaces/new?space=${s.id}`} className="text-white/60">
                      Continue scan
                    </Link>
                    {publishable && (
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => setPublished(s, !published)}
                        className={`ml-auto rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:opacity-45 ${
                          published
                            ? "border border-white/10 text-white/60 hover:text-white"
                            : "bg-[#C6A15B] text-[#0B0D10] hover:brightness-110"
                        }`}
                      >
                        {busyId === s.id ? "…" : published ? "Unpublish" : "Publish"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
