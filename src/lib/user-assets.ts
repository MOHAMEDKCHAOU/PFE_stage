/** Champs d’un média exposés par les API (upload, bibliothèque, sélecteur). */
export const ASSET_SELECT = {
  id: true,
  url: true,
  kind: true,
  mimeType: true,
  sizeBytes: true,
  originalName: true,
  title: true,
  altText: true,
  tags: true,
  width: true,
  height: true,
  source: true,
  createdAt: true,
} as const;

export const ASSET_TITLE_MAX = 120;
export const ASSET_ALT_MAX = 300;
export const ASSET_TAGS_MAX = 10;
export const ASSET_TAG_LENGTH_MAX = 32;
