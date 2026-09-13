"use client";

import { useEffect, useRef, useState } from "react";

type Props = { spaceId: string; onComplete?: (panoramaUrl: string) => void };

const TARGETS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

export function SmartScanCapture({ spaceId, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [frames, setFrames] = useState<Blob[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [status, setStatus] = useState("Ready to scan");
  const [busy, setBusy] = useState(false);
  const [sensor, setSensor] = useState<number | null>(null);
  const capturedRef = useRef(new Set<number>());
  const lastCaptureAt = useRef(0);

  useEffect(() => () => stream?.getTracks().forEach((track) => track.stop()), [stream]);

  useEffect(() => {
    function handleOrientation(event: DeviceOrientationEvent) {
      if (typeof event.alpha === "number") setSensor(event.alpha);
    }
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, []);

  async function start() {
    const DeviceOrientationEventWithPermission = DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };
    try { await DeviceOrientationEventWithPermission.requestPermission?.(); } catch { /* Android/browser does not require permission */ }
    const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    setStream(media);
    if (videoRef.current) { videoRef.current.srcObject = media; await videoRef.current.play(); }
    setStatus("Follow the gold target slowly");
  }

  function capture(target: number) {
    const now = Date.now();
    if (now - lastCaptureAt.current < 900 || capturedRef.current.has(target)) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth < 100) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      capturedRef.current.add(target);
      lastCaptureAt.current = now;
      setFrames((current) => [...current, blob]);
      setTargetIndex((index) => Math.min(index + 1, TARGETS.length));
      setStatus(capturedRef.current.size + 1 >= TARGETS.length ? "Coverage complete" : "Perfect. Keep following the guide");
    }, "image/jpeg", 0.88);
  }

  useEffect(() => {
    if (!stream || targetIndex >= TARGETS.length) return;
    const target = TARGETS[targetIndex];
    if (sensor !== null) {
      const diff = Math.abs((((sensor - target) % 360) + 540) % 360 - 180);
      if (diff < 10) capture(target);
      return;
    }
    const timer = window.setTimeout(() => capture(target), 1700);
    return () => window.clearTimeout(timer);
    // capture is intentionally driven by target changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensor, stream, targetIndex]);

  async function finish() {
    if (frames.length < 6) return;
    setBusy(true);
    setStatus("Uploading useful frames…");
    try {
      const form = new FormData();
      frames.forEach((frame, index) => form.append("frames", frame, `frame-${index}.jpg`));
      const upload = await fetch(`/api/spaces/${spaceId}/captures`, { method: "POST", body: form });
      if (!upload.ok) throw new Error((await upload.json()).error || "Upload failed");
      setStatus("Building your 360 space…");
      const process = await fetch(`/api/spaces/${spaceId}/process`, { method: "POST" });
      const result = await process.json();
      if (!process.ok) throw new Error(result.error || "Reconstruction failed");
      setStatus("Your Smart Space is ready ✓");
      onComplete?.(result.panoramaUrl);
      stream?.getTracks().forEach((track) => track.stop());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Processing failed");
    } finally { setBusy(false); }
  }

  const progress = Math.round((Math.min(frames.length, TARGETS.length) / TARGETS.length) * 100);
  const currentTarget = TARGETS[Math.min(targetIndex, TARGETS.length - 1)];
  const direction = currentTarget < 180 ? "Rotate slowly to the right →" : "Keep rotating →";

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black aspect-video">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
        {!stream && <div className="absolute inset-0 grid place-items-center bg-[#0B0D10]"><button onClick={start} className="rounded-2xl bg-[#C6A15B] px-6 py-3 font-semibold text-[#0B0D10]">Start Smart Scan</button></div>}
        {stream && targetIndex < TARGETS.length && (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#C6A15B] shadow-[0_0_40px_rgba(198,161,91,.45)]" />
            <div className="absolute inset-x-0 bottom-7 text-center"><span className="rounded-full bg-black/55 px-4 py-2 text-sm text-white">{sensor === null ? direction : `Move toward ${currentTarget}°`}</span></div>
          </div>
        )}
      </div>
      <aside className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <p className="text-xs uppercase tracking-[.18em] text-[#C6A15B]">Zero-effort capture</p>
        <h2 className="mt-2 text-xl font-semibold">Follow the target</h2>
        <p className="mt-2 text-sm text-white/55">Stay roughly in one place and move the camera slowly. Faymoos chooses the frames automatically.</p>
        <div className="mt-6 flex items-end justify-between"><strong className="text-4xl">{progress}%</strong><span className="text-xs text-white/40">{frames.length}/{TARGETS.length} coverage points</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-[#C6A15B] transition-all" style={{ width: `${progress}%` }} /></div>
        <p className="mt-5 min-h-10 text-sm text-white/70">{status}</p>
        {frames.length >= 6 && <button disabled={busy} onClick={finish} className="mt-5 w-full rounded-2xl bg-[#C6A15B] px-4 py-3 font-semibold text-[#0B0D10] disabled:opacity-50">{busy ? "Processing…" : frames.length >= TARGETS.length ? "Build my 360 space" : "Finish with current coverage"}</button>}
        <p className="mt-4 text-xs leading-5 text-white/35">LiDAR is optional. On supported phones, motion/depth data can improve reconstruction, but ordinary rear cameras remain supported.</p>
      </aside>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
