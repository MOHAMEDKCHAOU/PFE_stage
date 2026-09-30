"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";

type PartnerProfile = {
  code: string;
  joinPath: string;
  active: boolean;
  agencyName: string | null;
  logoUrl: string | null;
  joinsCount: number;
  rotatedAt: string | null;
  pendingRequests: number;
};

type Notice = { kind: "success" | "error"; text: string } | null;

const INPUT =
  "block w-full rounded-xl border border-white/10 bg-[#0B0D10] px-4 py-2.5 text-sm text-[#F7F4EE] placeholder:text-white/30 outline-none transition focus:border-[#C6A15B]/60 focus:ring-2 focus:ring-[#C6A15B]/20";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-3 py-2 text-xs font-medium text-white/80 transition hover:border-[#C6A15B]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-45";

const QR_OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  color: { dark: "#0B0D10", light: "#FFFFFF" },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Part de la largeur du QR occupée par le logo central (niveau H ≈ 30 % de redondance). */
const LOGO_RATIO = 0.22;

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Dessine l’image en « cover » (recadrage centré) dans un carré arrondi. */
function drawLogo(ctx: CanvasRenderingContext2D, logo: HTMLImageElement, x: number, y: number, size: number, radius: number) {
  const scale = Math.max(size / logo.width, size / logo.height);
  const sw = size / scale;
  const sh = size / scale;
  ctx.save();
  roundedRectPath(ctx, x, y, size, size, radius);
  ctx.clip();
  ctx.drawImage(logo, (logo.width - sw) / 2, (logo.height - sh) / 2, sw, sh, x, y, size, size);
  ctx.restore();
}

async function loadLogo(logoUrl: string | null): Promise<HTMLImageElement | null> {
  if (!logoUrl) return null;
  try {
    return await loadImage(logoUrl);
  } catch {
    return null; // logo introuvable : QR sans logo plutôt qu’une erreur
  }
}

/**
 * QR code avec, si fourni, le logo de l’agence au centre sur une pastille blanche.
 * Avec logo, la correction d’erreur passe en « H » pour que le QR reste lisible.
 */
async function renderQr(joinUrl: string, width: number, logo: HTMLImageElement | null): Promise<string> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, joinUrl, {
    ...QR_OPTIONS,
    errorCorrectionLevel: logo ? "H" : QR_OPTIONS.errorCorrectionLevel,
    width,
  });
  if (!logo) return canvas.toDataURL("image/png");

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/png");
  const size = Math.round(canvas.width * LOGO_RATIO);
  const pad = Math.round(size * 0.12);
  const x = (canvas.width - size) / 2;
  const y = (canvas.height - size) / 2;

  ctx.fillStyle = "#FFFFFF";
  roundedRectPath(ctx, x - pad, y - pad, size + pad * 2, size + pad * 2, (size + pad * 2) * 0.22);
  ctx.fill();
  drawLogo(ctx, logo, x, y, size, size * 0.18);
  return canvas.toDataURL("image/png");
}

/** Carte imprimable : logo + nom d’agence + QR + code, prête pour un flyer ou un comptoir. */
async function renderPrintableCard(joinUrl: string, code: string, title: string, logoUrl: string | null): Promise<string> {
  const logo = await loadLogo(logoUrl);
  const offset = logo ? 150 : 0;
  const W = 1000;
  const H = 1320 + offset;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");

  ctx.fillStyle = "#0B0D10";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#C6A15B";
  ctx.lineWidth = 6;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  if (logo) {
    const size = 130;
    ctx.fillStyle = "#FFFFFF";
    roundedRectPath(ctx, W / 2 - size / 2 - 8, 62, size + 16, size + 16, 30);
    ctx.fill();
    drawLogo(ctx, logo, W / 2 - size / 2, 70, size, 24);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#C6A15B";
  ctx.font = "600 30px sans-serif";
  ctx.fillText("PARTENAIRE FAYMOOS", W / 2, 120 + offset);
  ctx.fillStyle = "#F7F4EE";
  ctx.font = "700 56px sans-serif";
  const shown = title.length > 28 ? `${title.slice(0, 27)}…` : title;
  ctx.fillText(shown, W / 2, 200 + offset);

  const qr = await loadImage(await renderQr(joinUrl, 720, logo));
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(W / 2 - 380, 260 + offset, 760, 760);
  ctx.drawImage(qr, W / 2 - 360, 280 + offset, 720, 720);

  ctx.fillStyle = "#F7F4EE";
  ctx.font = "500 38px sans-serif";
  ctx.fillText("Scannez pour rejoindre mon espace", W / 2, 1110 + offset);
  ctx.fillStyle = "#C6A15B";
  ctx.font = "700 52px monospace";
  ctx.fillText(code, W / 2, 1190 + offset);

  return canvas.toDataURL("image/png");
}

export function PartnerQrPanel() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [busy, setBusy] = useState<null | "save" | "toggle" | "rotate" | "logo" | "download" | "print">(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  const joinUrl = profile ? `${origin}${profile.joinPath}` : "";

  const apply = useCallback((p: PartnerProfile) => {
    setProfile(p);
    setNameDraft(p.agencyName ?? "");
  }, []);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setOrigin(window.location.origin);
    (async () => {
      try {
        const res = await fetch("/api/studio/partner-code", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setNotice({
            kind: "error",
            text:
              typeof json.error === "string"
                ? json.error
                : `QR indisponible (erreur ${res.status}). Si vous venez de mettre à jour l’application, redémarrez le serveur.`,
          });
          return;
        }
        setNotice(null);
        apply(json as PartnerProfile);
      } catch {
        setNotice({ kind: "error", text: "QR indisponible : serveur injoignable." });
      }
    })();
  }, [apply, attempt]);

  const logoUrl = profile?.logoUrl ?? null;

  useEffect(() => {
    if (!joinUrl || !origin) return;
    let cancelled = false;
    loadLogo(logoUrl)
      .then((logo) => renderQr(joinUrl, 480, logo))
      .then((png) => {
        if (!cancelled) setQrDataUrl(png);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [joinUrl, origin, logoUrl]);

  async function patch(body: Record<string, unknown>, kind: NonNullable<typeof busy>, success?: string) {
    setBusy(kind);
    setNotice(null);
    const res = await fetch("/api/studio/partner-code", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setNotice({ kind: "error", text: typeof json.error === "string" ? json.error : "Erreur" });
      return false;
    }
    apply(json as PartnerProfile);
    if (success) setNotice({ kind: "success", text: success });
    return true;
  }

  async function uploadLogo(file: File) {
    setBusy("logo");
    setNotice(null);
    const form = new FormData();
    form.append("file", file);
    form.append("type", "avatar");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok || typeof json.url !== "string") {
      setNotice({ kind: "error", text: typeof json.error === "string" ? json.error : "Import du logo impossible." });
      return;
    }
    await patch({ logoUrl: json.url }, "logo", "Logo mis à jour.");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotice({ kind: "error", text: "Copie impossible — sélectionnez le lien manuellement." });
    }
  }

  async function downloadCard() {
    if (!profile) return;
    setBusy("download");
    try {
      const png = await renderPrintableCard(joinUrl, profile.code, profile.agencyName || "Mon espace", profile.logoUrl);
      const a = document.createElement("a");
      a.href = png;
      a.download = `faymoos-qr-${profile.code}.png`;
      a.click();
    } catch {
      setNotice({ kind: "error", text: "Téléchargement impossible." });
    } finally {
      setBusy(null);
    }
  }

  async function printCard() {
    if (!profile) return;
    const win = window.open("", "_blank", "width=720,height=900");
    if (!win) {
      setNotice({ kind: "error", text: "Autorisez les fenêtres pop-up pour imprimer." });
      return;
    }
    setBusy("print");
    try {
      const png = await renderPrintableCard(joinUrl, profile.code, profile.agencyName || "Mon espace", profile.logoUrl);
      win.document.title = `QR ${profile.code}`;
      const img = win.document.createElement("img");
      img.src = png;
      img.style.cssText = "width:100%;max-width:560px;display:block;margin:0 auto;";
      img.onload = () => {
        win.focus();
        win.print();
      };
      win.document.body.style.margin = "24px";
      win.document.body.appendChild(img);
    } catch {
      win.close();
      setNotice({ kind: "error", text: "Impression impossible." });
    } finally {
      setBusy(null);
    }
  }

  function rotate() {
    if (
      !window.confirm(
        "Générer un nouveau code ? L’ancien QR code (flyers, cartes déjà imprimés) cessera immédiatement de fonctionner.",
      )
    ) {
      return;
    }
    patch({ action: "rotate" }, "rotate", "Nouveau code généré. Pensez à réimprimer vos supports.");
  }

  if (!profile) {
    return notice ? (
      <div className="mt-5 space-y-3">
        <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-xs leading-relaxed text-red-200">
          {notice.text}
        </p>
        <button type="button" onClick={() => setAttempt((n) => n + 1)} className={BTN_SECONDARY}>
          Réessayer
        </button>
      </div>
    ) : (
      <div className="mt-5 h-72 animate-pulse rounded-2xl bg-white/[.035]" aria-busy="true" />
    );
  }

  return (
    <div className="mt-5 space-y-5">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className={`relative shrink-0 rounded-2xl bg-white p-2 ${profile.active ? "" : "opacity-40 grayscale"}`}>
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt={`QR code partenaire ${profile.code}`} className="h-40 w-40" />
          ) : (
            <div className="h-40 w-40 animate-pulse rounded-xl bg-zinc-200" />
          )}
          {!profile.active && (
            <span className="absolute inset-0 grid place-items-center text-xs font-semibold text-[#0B0D10]">
              Désactivé
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-white/40">Votre code</p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-wider text-[#E2C68E]">{profile.code}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <button type="button" disabled={busy !== null || !profile.active} onClick={downloadCard} className={BTN_SECONDARY}>
              {busy === "download" ? "…" : "↓ PNG"}
            </button>
            <button type="button" disabled={busy !== null || !profile.active} onClick={printCard} className={BTN_SECONDARY}>
              {busy === "print" ? "…" : "Imprimer"}
            </button>
            <button type="button" onClick={copyLink} className={BTN_SECONDARY}>
              {copied ? "Copié ✓" : "Copier le lien"}
            </button>
          </div>
          <p className="text-xs text-white/40">
            {profile.joinsCount} client{profile.joinsCount > 1 ? "s" : ""} rattaché{profile.joinsCount > 1 ? "s" : ""}{" "}
            via ce QR
            {profile.pendingRequests > 0 && (
              <span className="text-[#E2C68E]"> · {profile.pendingRequests} demande(s) à valider</span>
            )}
          </p>
        </div>
      </div>

      <p className="rounded-xl border border-white/10 bg-[#0B0D10] p-3 text-[11px] leading-relaxed text-white/45">
        Le client scanne, se connecte et <strong className="text-white/70">demande</strong> à vous rejoindre. Rien
        n’est lié tant que vous n’avez pas validé sa demande ci-dessus.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          patch({ agencyName: nameDraft }, "save", "Nom de l’agence enregistré.");
        }}
        className="space-y-1.5"
      >
        <label htmlFor="agency-name" className="text-xs font-medium text-white/60">
          Nom affiché aux clients
        </label>
        <div className="flex gap-2">
          <input
            id="agency-name"
            value={nameDraft}
            maxLength={80}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Ex. Atelier Nord — Agence digitale"
            className={INPUT}
          />
          <button
            type="submit"
            disabled={busy !== null || nameDraft.trim() === (profile.agencyName ?? "")}
            className={`${BTN_SECONDARY} shrink-0 px-4`}
          >
            {busy === "save" ? "…" : "Enregistrer"}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        {profile.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.logoUrl} alt="Logo de l’agence" className="h-10 w-10 rounded-xl border border-white/10 object-cover" />
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-dashed border-white/15 text-[10px] text-white/35">
            Logo
          </div>
        )}
        <label className={`${BTN_SECONDARY} cursor-pointer`}>
          {busy === "logo" ? "Import…" : profile.logoUrl ? "Changer le logo" : "Ajouter un logo"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={busy !== null}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) uploadLogo(file);
            }}
          />
        </label>
        {profile.logoUrl && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => patch({ logoUrl: null }, "logo", "Logo retiré.")}
            className="text-xs text-white/40 transition hover:text-red-300"
          >
            Retirer
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 text-xs text-white/65">
          <button
            type="button"
            role="switch"
            aria-checked={profile.active}
            aria-label="QR code actif"
            disabled={busy !== null}
            onClick={() =>
              patch(
                { action: profile.active ? "disable" : "enable" },
                "toggle",
                profile.active ? "QR code désactivé : les scans sont refusés." : "QR code réactivé.",
              )
            }
            className={`relative h-6 w-11 rounded-full transition ${profile.active ? "bg-[#C6A15B]" : "bg-white/15"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#0B0D10] transition-all ${
                profile.active ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
          {profile.active ? "QR actif" : "QR désactivé"}
        </div>
        <button
          type="button"
          disabled={busy !== null}
          onClick={rotate}
          className="text-xs font-medium text-white/45 transition hover:text-red-300 disabled:opacity-45"
        >
          {busy === "rotate" ? "Génération…" : "Régénérer le code"}
        </button>
      </div>

      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={`rounded-xl border p-3 text-xs ${
            notice.kind === "error"
              ? "border-red-400/25 bg-red-400/10 text-red-200"
              : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
          }`}
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}
