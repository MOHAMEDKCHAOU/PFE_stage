"use client";

import { useEffect, useRef, useState } from "react";
import { parseSafeUrl } from "@/lib/safe-url";

type Hotspot = {
  id: string;
  label: string;
  type: string;
  yaw: number;
  pitch: number;
  targetUrl?: string | null;
  metadata?: unknown;
};

const PILL =
  "absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-full border border-[#C6A15B]/60 bg-[#0B0D10]/85 px-3 py-2 text-xs font-medium text-[#F7F4EE] backdrop-blur transition hover:border-[#C6A15B]";

function descriptionOf(metadata: unknown): string | null {
  if (metadata && typeof metadata === "object" && "description" in metadata) {
    const d = (metadata as { description: unknown }).description;
    return typeof d === "string" && d.trim() ? d : null;
  }
  return null;
}

export function SmartSpaceViewer({ panoramaUrl, hotspots = [] }: { panoramaUrl: string; hotspots?: Hotspot[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; yaw: number } | null>(null);
  const [yaw, setYaw] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const move = (e: PointerEvent) => { if (!drag.current) return; setYaw(drag.current.yaw + (drag.current.x - e.clientX) * 0.12); };
    const up = () => { drag.current = null; };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  return <div ref={ref} onPointerDown={(e) => { setOpenId(null); drag.current = { x: e.clientX, yaw }; ref.current?.setPointerCapture?.(e.pointerId); }} className="relative min-h-[520px] cursor-grab overflow-hidden rounded-3xl border border-white/10 bg-black active:cursor-grabbing" style={{ backgroundImage: `url("${encodeURI(panoramaUrl)}")`, backgroundSize: "auto 100%", backgroundRepeat: "repeat-x", backgroundPosition: `${50 - yaw / 3.6}% center` }}>
    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
    {hotspots.map((h) => {
      const relative = ((((h.yaw - yaw) % 360) + 540) % 360) - 180;
      if (Math.abs(relative) > 75) return null;
      const position = { left: `${50 + (relative / 75) * 50}%`, top: `${50 - Math.max(-60, Math.min(60, h.pitch)) * 0.55}%` };
      const stop = (e: React.PointerEvent) => e.stopPropagation();

      // Défense en profondeur : même validé à l’enregistrement, le lien est revérifié ici.
      const link = h.type === "INFO" ? null : parseSafeUrl(h.targetUrl);
      if (link) {
        return <a key={h.id} href={link.href} className={PILL} style={position} onPointerDown={stop}
          {...(link.external ? { target: "_blank", rel: "noopener noreferrer nofollow ugc", title: `Ouvre ${link.host} dans un nouvel onglet` } : {})}>
          {h.label}
          {link.external && <span aria-hidden className="text-[#C6A15B]">↗</span>}
          {link.external && <span className="sr-only"> (site externe : {link.host}, nouvel onglet)</span>}
        </a>;
      }

      // Pas de lien valide : bouton (jamais href="#"), avec la description éventuelle en info-bulle.
      const description = descriptionOf(h.metadata);
      const open = openId === h.id;
      return <div key={h.id} className="absolute" style={position}>
        <button type="button" className={PILL} style={{ left: 0, top: 0 }} onPointerDown={stop} aria-expanded={description ? open : undefined}
          onClick={() => description && setOpenId(open ? null : h.id)}>
          {h.label}{description && <span aria-hidden className="text-[#C6A15B]">i</span>}
        </button>
        {open && description && <p role="tooltip" className="absolute left-0 top-6 z-10 w-56 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0B0D10]/95 p-3 text-xs leading-relaxed text-white/75 shadow-xl" onPointerDown={stop}>{description}</p>}
      </div>;
    })}
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-xs text-white/70">Drag to look around</div>
  </div>;
}
