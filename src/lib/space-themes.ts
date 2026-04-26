/** Thèmes alignés sur CapsuleViewer / explore (8 + défaut) */
export const SPACE_THEME_IDS = [
  "default",
  "ocean",
  "sunset",
  "forest",
  "berry",
  "gold",
  "midnight",
  "coral",
] as const;

export type SpaceThemeId = (typeof SPACE_THEME_IDS)[number];

export const spaceThemePresets: {
  id: SpaceThemeId;
  name: string;
  description: string;
  preview: { gradient: string; accent: string };
}[] = [
  {
    id: "default",
    name: "Clair & équilibré",
    description: "Neutre, met en avant le contenu",
    preview: { gradient: "from-zinc-500 to-slate-600", accent: "text-zinc-300" },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Frais, professionnel, tech",
    preview: { gradient: "from-sky-500 to-cyan-500", accent: "text-sky-300" },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Chaleureux, créatif",
    preview: { gradient: "from-orange-500 to-red-500", accent: "text-orange-200" },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Nature, confiance, durable",
    preview: { gradient: "from-green-500 to-teal-500", accent: "text-green-200" },
  },
  {
    id: "berry",
    name: "Berry",
    description: "Audacieux, design & mode",
    preview: { gradient: "from-pink-500 to-purple-500", accent: "text-pink-200" },
  },
  {
    id: "gold",
    name: "Gold",
    description: "Premium, institutionnel",
    preview: { gradient: "from-yellow-500 to-amber-500", accent: "text-amber-100" },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Sombre, focus data & dev",
    preview: { gradient: "from-blue-500 to-indigo-500", accent: "text-blue-200" },
  },
  {
    id: "coral",
    name: "Coral",
    description: "Accueillant, humain",
    preview: { gradient: "from-rose-400 to-pink-400", accent: "text-rose-100" },
  },
];

export function isSpaceThemeId(s: string): s is SpaceThemeId {
  return (SPACE_THEME_IDS as readonly string[]).includes(s);
}
