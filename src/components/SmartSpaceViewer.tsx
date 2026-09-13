"use client";

import { useEffect, useRef, useState } from "react";

type Hotspot = { id: string; label: string; type: string; yaw: number; pitch: number; targetUrl?: string | null };
export function SmartSpaceViewer({ panoramaUrl, hotspots = [] }: { panoramaUrl: string; hotspots?: Hotspot[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; yaw: number } | null>(null);
  const [yaw, setYaw] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const move = (e: PointerEvent) => { if (!drag.current) return; setYaw(drag.current.yaw + (drag.current.x - e.clientX) * 0.12); };
    const up = () => { drag.current = null; };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);
  return <div ref={ref} onPointerDown={(e) => { drag.current = { x: e.clientX, yaw }; ref.current?.setPointerCapture?.(e.pointerId); }} className="relative min-h-[520px] cursor-grab overflow-hidden rounded-3xl border border-white/10 bg-black active:cursor-grabbing" style={{ backgroundImage: `url(${panoramaUrl})`, backgroundSize: "auto 100%", backgroundRepeat: "repeat-x", backgroundPosition: `${50 - yaw / 3.6}% center` }}>
    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
    {hotspots.map((h) => {
      const relative = ((((h.yaw - yaw) % 360) + 540) % 360) - 180;
      if (Math.abs(relative) > 75) return null;
      const left = 50 + (relative / 75) * 50;
      const top = 50 - Math.max(-60, Math.min(60, h.pitch)) * 0.55;
      return <a key={h.id} href={h.targetUrl || "#"} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C6A15B]/60 bg-[#0B0D10]/85 px-3 py-2 text-xs font-medium text-[#F7F4EE] backdrop-blur" style={{ left: `${left}%`, top: `${top}%` }} onPointerDown={(e) => e.stopPropagation()}>{h.label}</a>;
    })}
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-xs text-white/70">Drag to look around</div>
  </div>;
}
