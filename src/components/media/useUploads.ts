"use client";

import { useCallback, useState } from "react";
import { formatBytes, MAX_UPLOAD_BYTES, type MediaAsset, type UploadType } from "./media-types";

export type UploadItem = {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
  deduplicated?: boolean;
};

type UploadResult = { ok: true; asset: MediaAsset; deduplicated: boolean } | { ok: false; error: string };

/** XHR (et non fetch) pour suivre la progression de l’envoi. */
function sendFile(file: File, type: UploadType, onProgress: (pct: number) => void): Promise<UploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    xhr.open("POST", "/api/upload");
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let json: { asset?: MediaAsset; error?: string; deduplicated?: boolean } = {};
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        /* réponse non JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && json.asset) {
        resolve({ ok: true, asset: json.asset, deduplicated: Boolean(json.deduplicated) });
      } else {
        resolve({ ok: false, error: json.error || `Échec de l’envoi (erreur ${xhr.status})` });
      }
    };
    xhr.onerror = () => resolve({ ok: false, error: "Connexion interrompue" });
    xhr.send(form);
  });
}

let counter = 0;

/** Envoi de plusieurs fichiers (2 en parallèle) avec progression et erreur par fichier. */
export function useUploads(type: UploadType) {
  const [items, setItems] = useState<UploadItem[]>([]);

  const patch = (id: string, change: Partial<UploadItem>) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...change } : i)));

  const upload = useCallback(
    async (files: File[]): Promise<MediaAsset[]> => {
      const queue = files.map((file) => ({ file, id: `up-${Date.now()}-${counter++}` }));
      setItems((list) => [
        ...queue.map(({ file, id }) => ({ id, name: file.name, progress: 0, status: "uploading" as const })),
        ...list.filter((i) => i.status === "uploading"),
      ]);

      const done: MediaAsset[] = [];
      const worker = async () => {
        for (let next = queue.shift(); next; next = queue.shift()) {
          const { file, id } = next;
          if (file.size > MAX_UPLOAD_BYTES) {
            patch(id, { status: "error", error: `Trop volumineux (${formatBytes(file.size)}, max 80 Mo)` });
            continue;
          }
          const result = await sendFile(file, type, (progress) => patch(id, { progress }));
          if (result.ok) {
            done.push(result.asset);
            patch(id, { status: "done", progress: 100, deduplicated: result.deduplicated });
          } else {
            patch(id, { status: "error", error: result.error });
          }
        }
      };
      await Promise.all([worker(), worker()]);
      return done;
    },
    [type],
  );

  const dismiss = useCallback((id: string) => setItems((list) => list.filter((i) => i.id !== id)), []);
  const clearFinished = useCallback(() => setItems((list) => list.filter((i) => i.status === "uploading")), []);

  return { items, upload, dismiss, clearFinished, busy: items.some((i) => i.status === "uploading") };
}
