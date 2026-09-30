import sharp from "sharp";
import type { DetectedMedia } from "@/lib/media-validation";

/** Plus grand côté conservé : au-delà, l’image est réduite (poids / performances). */
export const MAX_IMAGE_DIMENSION = 4096;

export type SanitizedImage = { buffer: Buffer; width: number; height: number };

/**
 * Ré-encode l’image avec sharp :
 *  - supprime toutes les métadonnées (EXIF dont GPS, XMP, IPTC, commentaires) ;
 *  - applique l’orientation EXIF avant de la retirer (photo à l’endroit) ;
 *  - neutralise les fichiers « polyglottes » (image valide + contenu caché) ;
 *  - réduit les images géantes à MAX_IMAGE_DIMENSION.
 * Lève une erreur si l’image ne peut pas être décodée (fichier corrompu ou falsifié).
 */
export async function sanitizeImage(input: Buffer, ext: DetectedMedia["ext"]): Promise<SanitizedImage> {
  const animated = ext === "gif" || ext === "webp";
  let pipeline = sharp(input, { animated, failOn: "error" })
    .rotate()
    .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: "inside", withoutEnlargement: true });

  switch (ext) {
    case "jpg":
      pipeline = pipeline.jpeg({ quality: 88, mozjpeg: true });
      break;
    case "png":
      pipeline = pipeline.png({ compressionLevel: 9 });
      break;
    case "webp":
      pipeline = pipeline.webp({ quality: 88 });
      break;
    case "gif":
      pipeline = pipeline.gif();
      break;
    default:
      throw new Error(`Not an image: ${ext}`);
  }

  // Sans .withMetadata(), sharp n’écrit aucune métadonnée dans le fichier de sortie.
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.pageHeight ?? info.height };
}
