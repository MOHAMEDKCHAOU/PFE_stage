"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Step = "capture" | "preview";

type Props = {
  open: boolean;
  onClose: () => void;
  onUseScan: (file: File) => Promise<void>;
};

export function ScanCaptureWorkflow({ open, onClose, onUseScan }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("capture");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [hint, setHint] = useState("Cadrez votre sujet, puis capturez.");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const resetPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBlob(null);
  }, [previewUrl]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      resetPreview();
      setStep("capture");
      setError("");
      setHint("Cadrez votre sujet, puis capturez.");
      return;
    }

    let cancelled = false;
    setError("");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          void v.play().catch(() => setError("Impossible de lire le flux vidéo."));
        }
      })
      .catch(() => {
        setError("Caméra refusée ou indisponible. Utilisez l’upload fichier ci-dessous.");
      });

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, stopCamera]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const doCapture = useCallback(() => {
    const v = videoRef.current;
    if (!v || v.videoWidth < 2) {
      setHint("Patientez, la caméra s’initialise…");
      return;
    }
    setHint("Compression…");
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Échec de la capture.");
          return;
        }
        stopCamera();
        resetPreview();
        const url = URL.createObjectURL(blob);
        setPreviewBlob(blob);
        setPreviewUrl(url);
        setStep("preview");
        setHint("");
      },
      "image/jpeg",
      0.82,
    );
  }, [resetPreview, stopCamera]);

  const retake = useCallback(() => {
    resetPreview();
    setStep("capture");
    setError("");
    setHint("Recadrez, puis capturez à nouveau.");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        const vid = videoRef.current;
        if (vid) {
          vid.srcObject = stream;
          void vid.play().catch(() => {});
        }
      })
      .catch(() => setError("Caméra indisponible."));
  }, [resetPreview]);

  const useScan = useCallback(async () => {
    if (!previewBlob) return;
    setBusy(true);
    try {
      const file = new File([previewBlob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
      await onUseScan(file);
      resetPreview();
      onClose();
    } catch {
      setError("Échec de l’envoi. Réessayez.");
    } finally {
      setBusy(false);
    }
  }, [onClose, onUseScan, previewBlob, resetPreview]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="absolute inset-0 bg-black/70" aria-hidden />

      {step === "capture" && (
        <>
          <video
            ref={videoRef}
            className="relative z-[1] h-full w-full object-cover"
            playsInline
            muted
            autoPlay
          />
          <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-between bg-gradient-to-b from-black/50 via-transparent to-black/60 px-4 pb-10 pt-14">
            <p className="max-w-md text-center text-sm font-medium text-white drop-shadow-md">
              {hint}
            </p>
            <p className="text-center text-xs text-white/80">Scan guidé — pas de modèle 3D temps réel</p>
          </div>
          <div className="absolute bottom-8 left-0 right-0 z-[3] flex justify-center gap-4 px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-zinc-900/15 px-5 py-3 text-sm font-medium text-white backdrop-blur-md"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={doCapture}
              className="h-16 w-16 rounded-full border-4 border-white bg-zinc-900/45 shadow-lg ring-4 ring-bordeaux-500/40"
              aria-label="Capturer"
            />
          </div>
        </>
      )}

      {step === "preview" && previewUrl && (
        <>
          <img src={previewUrl} alt="Aperçu du scan" className="relative z-[1] h-full w-full object-contain" />
          <div className="absolute inset-x-0 bottom-0 z-[2] flex gap-3 border-t border-white/10 bg-black/55 px-4 py-5 backdrop-blur-md">
            <button
              type="button"
              onClick={retake}
              disabled={busy}
              className="flex-1 rounded-xl border border-white/30 py-3 text-sm font-semibold text-white"
            >
              Recommencer
            </button>
            <button
              type="button"
              onClick={() => void useScan()}
              disabled={busy}
              className="flex-1 rounded-xl bg-bordeaux-700 py-3 text-sm font-semibold text-white hover:bg-bordeaux-600 disabled:opacity-50"
            >
              {busy ? "Envoi…" : "Utiliser ce scan"}
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="absolute left-4 right-4 top-16 z-[4] rounded-lg bg-red-950/90 px-3 py-2 text-center text-sm text-red-100">
          {error}
        </div>
      )}
    </div>
  );
}
