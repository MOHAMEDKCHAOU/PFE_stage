/**
 * Palettes de couleur pour IdentityProfile.theme
 * (sélecteur identité + capsule publique + explore).
 */
export const IDENTITY_THEME_IDS = [
  "default",
  "ocean",
  "sunset",
  "forest",
  "berry",
  "gold",
  "midnight",
  "coral",
] as const;

export type IdentityThemeId = (typeof IDENTITY_THEME_IDS)[number];

export type IdentityThemePalette = {
  id: IdentityThemeId | "";
  label: string;
  from: string;
  to: string;
  /** Classes Tailwind pour bg-gradient-to-* */
  gradient: string;
  accent: string;
};

/** Thèmes sélectionnables (valeur DB = value ; "" = par défaut / type métier) */
export const identityThemePresets: IdentityThemePalette[] = [
  {
    id: "",
    label: "Par défaut",
    from: "#C6A15B",
    to: "#8B6914",
    gradient: "from-[#C6A15B] to-[#8B6914]",
    accent: "text-[#C6A15B]",
  },
  {
    id: "ocean",
    label: "Océan",
    from: "#0284C7",
    to: "#06B6D4",
    gradient: "from-[#0284C7] to-[#06B6D4]",
    accent: "text-[#38BDF8]",
  },
  {
    id: "sunset",
    label: "Coucher",
    from: "#F97316",
    to: "#E11D48",
    gradient: "from-[#F97316] to-[#E11D48]",
    accent: "text-[#FB923C]",
  },
  {
    id: "forest",
    label: "Forêt",
    from: "#15803D",
    to: "#0D9488",
    gradient: "from-[#15803D] to-[#0D9488]",
    accent: "text-[#4ADE80]",
  },
  {
    id: "berry",
    label: "Berry",
    from: "#DB2777",
    to: "#7C3AED",
    gradient: "from-[#DB2777] to-[#7C3AED]",
    accent: "text-[#F472B6]",
  },
  {
    id: "gold",
    label: "Or",
    from: "#F59E0B",
    to: "#B45309",
    gradient: "from-[#F59E0B] to-[#B45309]",
    accent: "text-[#FBBF24]",
  },
  {
    id: "midnight",
    label: "Nuit",
    from: "#1D4ED8",
    to: "#6D28D9",
    gradient: "from-[#1D4ED8] to-[#6D28D9]",
    accent: "text-[#818CF8]",
  },
  {
    id: "coral",
    label: "Corail",
    from: "#F43F5E",
    to: "#FB7185",
    gradient: "from-[#F43F5E] to-[#FB7185]",
    accent: "text-[#FDA4AF]",
  },
];

/** Accents par type de profil quand aucun thème n'est choisi */
export const identityTypePalettes: Record<
  string,
  { label: string; gradient: string; accent: string; from: string; to: string }
> = {
  FREELANCER: {
    label: "Freelancer",
    from: "#C6A15B",
    to: "#8B6914",
    gradient: "from-[#C6A15B] to-[#8B6914]",
    accent: "text-[#C6A15B]",
  },
  AGENCY: {
    label: "Agence",
    from: "#2563EB",
    to: "#0EA5E9",
    gradient: "from-[#2563EB] to-[#0EA5E9]",
    accent: "text-[#60A5FA]",
  },
  CREATOR: {
    label: "Créateur",
    from: "#EC4899",
    to: "#A855F7",
    gradient: "from-[#EC4899] to-[#A855F7]",
    accent: "text-[#F472B6]",
  },
  STARTUP: {
    label: "Startup",
    from: "#10B981",
    to: "#06B6D4",
    gradient: "from-[#10B981] to-[#06B6D4]",
    accent: "text-[#34D399]",
  },
};

export function getIdentityThemeOverride(
  theme: string | null | undefined,
): { gradient: string; accent: string } | null {
  if (!theme) return null;
  const preset = identityThemePresets.find((p) => p.id === theme);
  if (!preset || !preset.id) return null;
  return { gradient: preset.gradient, accent: preset.accent };
}

export function resolveIdentityColors(
  type: string,
  theme: string | null | undefined,
): { label: string; gradient: string; accent: string } {
  const base = identityTypePalettes[type] || identityTypePalettes.FREELANCER;
  const override = getIdentityThemeOverride(theme);
  if (override) {
    return { label: base.label, ...override };
  }
  return {
    label: base.label,
    gradient: base.gradient,
    accent: base.accent,
  };
}
