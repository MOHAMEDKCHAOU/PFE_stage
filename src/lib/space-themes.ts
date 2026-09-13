import { identityThemePresets } from "@/lib/identity-themes";

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

function paletteFor(id: SpaceThemeId) {
  if (id === "default") {
    return identityThemePresets.find((p) => p.id === "")!;
  }
  return identityThemePresets.find((p) => p.id === id)!;
}

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
    preview: {
      gradient: paletteFor("default").gradient,
      accent: paletteFor("default").accent,
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Frais, professionnel, tech",
    preview: {
      gradient: paletteFor("ocean").gradient,
      accent: paletteFor("ocean").accent,
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Chaleureux, créatif",
    preview: {
      gradient: paletteFor("sunset").gradient,
      accent: paletteFor("sunset").accent,
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Nature, confiance, durable",
    preview: {
      gradient: paletteFor("forest").gradient,
      accent: paletteFor("forest").accent,
    },
  },
  {
    id: "berry",
    name: "Berry",
    description: "Audacieux, design & mode",
    preview: {
      gradient: paletteFor("berry").gradient,
      accent: paletteFor("berry").accent,
    },
  },
  {
    id: "gold",
    name: "Gold",
    description: "Premium, institutionnel",
    preview: {
      gradient: paletteFor("gold").gradient,
      accent: paletteFor("gold").accent,
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Sombre, focus data & dev",
    preview: {
      gradient: paletteFor("midnight").gradient,
      accent: paletteFor("midnight").accent,
    },
  },
  {
    id: "coral",
    name: "Coral",
    description: "Accueillant, humain",
    preview: {
      gradient: paletteFor("coral").gradient,
      accent: paletteFor("coral").accent,
    },
  },
];

export function isSpaceThemeId(s: string): s is SpaceThemeId {
  return (SPACE_THEME_IDS as readonly string[]).includes(s);
}
