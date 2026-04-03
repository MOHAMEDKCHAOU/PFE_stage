import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Adresse email invalide"),
  password: z
    .string()
    .min(1, "Le mot de passe est requis"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(50, "Le nom ne peut pas dépasser 50 caractères"),
    email: z
      .string()
      .min(1, "L'email est requis")
      .email("Adresse email invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(/[A-Z]/, "Doit contenir au moins une majuscule")
      .regex(/[a-z]/, "Doit contenir au moins une minuscule")
      .regex(/[0-9]/, "Doit contenir au moins un chiffre"),
    confirmPassword: z
      .string()
      .min(1, "Veuillez confirmer le mot de passe"),
    type: z.enum(["FREELANCER", "AGENCY", "CREATOR", "STARTUP"], {
      message: "Le type de profil est requis",
    }),
    role: z.enum(["USER", "AFFILIATEUR"]).default("USER"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export const profileTypes = [
  { value: "FREELANCER", label: "Freelancer", icon: "💼", desc: "Indépendant & consultant" },
  { value: "AGENCY", label: "Agence", icon: "🏢", desc: "Studio & équipe créative" },
  { value: "CREATOR", label: "Créateur", icon: "🎨", desc: "Artiste & content creator" },
  { value: "STARTUP", label: "Startup", icon: "🚀", desc: "Entrepreneur & fondateur" },
] as const;

export const roleTypes = [
  { value: "USER", label: "Utilisateur", icon: "👤", desc: "Gérer mes propres capsules" },
  { value: "AFFILIATEUR", label: "Affiliateur", icon: "🤝", desc: "Gérer des clients & leurs capsules" },
] as const;
