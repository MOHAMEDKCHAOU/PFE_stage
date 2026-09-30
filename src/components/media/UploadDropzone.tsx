"use client";

import { useRef, useState } from "react";
import type { UploadItem } from "./useUploads";

/** Zone de dépôt (glisser-déposer ou parcourir) + suivi des envois en cours. */
export function UploadDropzone({
  accept,
  hint,
  items,
  busy,
  onFiles,
  onDismiss,
  compact = false,
  multiple = true,
}: {
  accept: string;
  hint: string;
  items: UploadItem[];
  busy: boolean;
  onFiles: (files: File[]) => void;
  onDismiss: (id: string) => void;
  compact?: boolean;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length) onFiles(multiple ? files : files.slice(0, 1));
        }}
        className={`flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed text-center transition ${
          compact ? "px-4 py-4" : "px-6 py-7"
        } ${over ? "border-[#C6A15B] bg-[#C6A15B]/10" : "border-white/15 bg-white/[.02] hover:border-[#C6A15B]/50 hover:bg-white/[.04]"}`}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C6A15B]/30 bg-[#C6A15B]/10 text-lg text-[#C6A15B]" aria-hidden>
          ↑
        </span>
        <div className="text-left">
          <p className="text-sm font-medium text-[#F7F4EE]">
            {over ? "Déposez pour envoyer" : busy ? "Envoi en cours… vous pouvez en ajouter d’autres" : "Glissez vos fichiers ici ou cliquez pour parcourir"}
          </p>
          <p className="mt-0.5 text-xs text-white/40">{hint}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) onFiles(files);
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className="space-y-1.5" aria-live="polite">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B0D10] px-3 py-2 text-xs">
              <span className="min-w-0 flex-1 truncate text-white/75">{item.name}</span>
              {item.status === "uploading" && (
                <span className="flex w-28 items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-[#C6A15B] transition-all" style={{ width: `${item.progress}%` }} />
                  </span>
                  <span className="w-8 text-right tabular-nums text-white/45">{item.progress}%</span>
                </span>
              )}
              {item.status === "done" && (
                <span className="text-emerald-300">{item.deduplicated ? "Déjà dans la bibliothèque ✓" : "Envoyé ✓"}</span>
              )}
              {item.status === "error" && <span className="max-w-[60%] text-right text-red-300">{item.error}</span>}
              {item.status !== "uploading" && (
                <button type="button" onClick={() => onDismiss(item.id)} aria-label={`Masquer ${item.name}`} className="text-white/35 hover:text-white">
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
