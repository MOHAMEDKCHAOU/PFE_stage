"use client";

import type { MediaAsset } from "./media-types";

/** Vignette carrée d’un média (image, vidéo avec icône lecture, ou pastille 3D). */
export function AssetThumb({ asset, className = "" }: { asset: MediaAsset; className?: string }) {
  if (asset.kind === "IMAGE") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.url}
        alt={asset.altText ?? ""}
        loading="lazy"
        decoding="async"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  if (asset.kind === "VIDEO") {
    return (
      <div className={`relative h-full w-full bg-black ${className}`}>
        <video src={`${asset.url}#t=0.5`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center" aria-hidden>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-black/60 text-sm text-white">▶</span>
        </span>
      </div>
    );
  }
  const ext = asset.url.split(".").pop()?.toUpperCase() ?? "3D";
  return (
    <div className={`grid h-full w-full place-items-center bg-gradient-to-br from-[#C6A15B]/15 to-white/[.03] ${className}`}>
      <div className="text-center">
        <span className="block text-2xl text-[#C6A15B]" aria-hidden>
          ◈
        </span>
        <span className="mt-1 block text-[10px] font-semibold tracking-wider text-white/50">{ext}</span>
      </div>
    </div>
  );
}
