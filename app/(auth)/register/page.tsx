"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  registerSchema,
  type RegisterFormData,
  profileTypes,
} from "@/lib/validations/auth";

// Minimal Zod resolver for react-hook-form
function zodResolver(schema: typeof registerSchema) {
  return async (values: RegisterFormData) => {
    const result = schema.safeParse(values);
    if (result.success) return { values: result.data, errors: {} };
    const fieldErrors: Record<string, { message: string }> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = { message: issue.message };
    }
    return { values: {}, errors: fieldErrors };
  };
}

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthLabels = ["", "Faible", "Moyen", "Bon", "Fort", "Excellent"];
const strengthColors = [
  "",
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-emerald-500",
  "bg-emerald-400",
];

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const nextSafe =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : null;
  const loginWithNext = nextSafe ? `/login?next=${encodeURIComponent(nextSafe)}` : "/login";
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      type: undefined,
      role: "USER",
    },
  });

  const watchedPassword = watch("password", "");
  const watchedType = watch("type");
  const passwordStrength = getPasswordStrength(watchedPassword);

  async function handleNextStep() {
    const valid = await trigger(["name", "email", "password", "confirmPassword"]);
    if (valid) setStep(2);
  }

  async function handleFinalSubmit() {
    const values = getValues();
    const result = registerSchema.safeParse(values);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      if (firstIssue) {
        const field = String(firstIssue.path[0]);
        if (["name", "email", "password", "confirmPassword"].includes(field)) {
          setStep(1);
        }
        setServerError(firstIssue.message);
      }
      return;
    }

    setIsLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: result.data.email,
          password: result.data.password,
          name: result.data.name,
          type: result.data.type,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error || "Une erreur est survenue");
        if (res.status === 409) setStep(1);
        return;
      }

      router.push(loginWithNext);
    } catch {
      setServerError("Impossible de se connecter au serveur");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Mobile logo */}
      <div className="flex items-center gap-3 mb-10 lg:hidden">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-bordeaux-800 to-bordeaux-500 flex items-center justify-center shadow-lg shadow-bordeaux-500/20">
          <span className="text-white font-bold text-base">F</span>
        </div>
        <span className="text-xl font-bold text-foreground tracking-tight">
          Faymoos
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Créer votre compte
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          {step === 1
            ? "Remplissez vos informations pour commencer"
            : "Choisissez votre type de profil"}
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
              step >= 1
                ? "bg-bordeaux-500 text-white shadow-md shadow-bordeaux-500/20"
                : "bg-bordeaux-500/10 text-zinc-500"
            }`}
          >
            {step > 1 ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              "1"
            )}
          </div>
          <span className={`text-xs font-medium ${step >= 1 ? "text-foreground" : "text-zinc-500"}`}>
            Informations
          </span>
        </div>
        <div className={`h-px w-8 transition-colors duration-300 ${step >= 2 ? "bg-bordeaux-500" : "bg-zinc-900/[0.08]"}`} />
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
              step >= 2
                ? "bg-bordeaux-500 text-white shadow-md shadow-bordeaux-500/20"
                : "bg-bordeaux-500/10 text-zinc-500"
            }`}
          >
            2
          </div>
          <span className={`text-xs font-medium ${step >= 2 ? "text-foreground" : "text-zinc-500"}`}>
            Profil
          </span>
        </div>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3.5">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm text-red-400">{serverError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
        {/* ─── STEP 1: Credentials ─── */}
        <div className={step === 1 ? "space-y-5" : "hidden"}>
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Nom complet
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <svg className="h-[18px] w-[18px] text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                {...register("name")}
                className={`block w-full rounded-xl border border-white/10 bg-zinc-900/45 py-3 pl-11 pr-4 text-sm text-foreground shadow-sm placeholder:text-zinc-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-offset-0 ${
                errors.name
                    ? "border-red-500/50 focus:ring-red-500/20"
                    : "focus:border-bordeaux-400 focus:ring-bordeaux-200/50"
              }`}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-500 pl-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Adresse email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <svg className="h-[18px] w-[18px] text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                {...register("email")}
                className={`block w-full rounded-xl border border-white/10 bg-zinc-900/45 py-3 pl-11 pr-4 text-sm text-foreground shadow-sm placeholder:text-zinc-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-offset-0 ${
                  errors.email
                    ? "border-red-500/50 focus:ring-red-500/20"
                    : "focus:border-bordeaux-400 focus:ring-bordeaux-200/50"
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 pl-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Mot de passe
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <svg className="h-[18px] w-[18px] text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min. 8 caractères"
                {...register("password")}
                className={`block w-full rounded-xl border border-white/10 bg-zinc-900/45 py-3 pl-11 pr-11 text-sm text-foreground shadow-sm placeholder:text-zinc-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-offset-0 ${
                  errors.password
                    ? "border-red-500/50 focus:ring-red-500/20"
                    : "focus:border-bordeaux-400 focus:ring-bordeaux-200/50"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-500 hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password strength indicator */}
            {watchedPassword && (
              <div className="space-y-2 pt-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength >= level
                          ? strengthColors[passwordStrength]
                          : "bg-bordeaux-500/10"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${passwordStrength <= 2 ? "text-red-500" : passwordStrength <= 3 ? "text-yellow-400" : "text-emerald-400"}`}>
                  {strengthLabels[passwordStrength]}
                </p>
              </div>
            )}

            {errors.password && (
              <p className="text-xs text-red-500 pl-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <svg className="h-[18px] w-[18px] text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Retapez le mot de passe"
                {...register("confirmPassword")}
                className={`block w-full rounded-xl border border-white/10 bg-zinc-900/45 py-3 pl-11 pr-4 text-sm text-foreground shadow-sm placeholder:text-zinc-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-offset-0 ${
                  errors.confirmPassword
                    ? "border-red-500/50 focus:ring-red-500/20"
                    : "focus:border-bordeaux-400 focus:ring-bordeaux-200/50"
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 pl-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Next step button */}
          <button
            type="button"
            onClick={handleNextStep}
            className="w-full rounded-xl bg-gradient-to-r from-bordeaux-800 to-bordeaux-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-bordeaux-500/20 transition-all duration-200 hover:from-bordeaux-600 hover:to-bordeaux-400 hover:shadow-xl hover:shadow-bordeaux-500/25 active:scale-[0.98]"
          >
            Continuer
          </button>
        </div>

        {/* ─── STEP 2: Profile Type ─── */}
        <div className={step === 2 ? "space-y-5" : "hidden"}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Type de profil
            </label>
            <p className="text-xs text-zinc-500">
              Vous pourrez créer d&apos;autres profils plus tard
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {profileTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setValue("type", type.value as RegisterFormData["type"], { shouldValidate: true })}
                className={`group relative flex flex-col items-start rounded-xl border p-4 text-left transition-all duration-200 active:scale-[0.97] ${
                  watchedType === type.value
                    ? "border-bordeaux-500/50 bg-bordeaux-500/10 shadow-md shadow-bordeaux-500/20 ring-1 ring-bordeaux-500/40"
                    : "border-white/10 bg-zinc-900/45 hover:border-bordeaux-200 hover:bg-bordeaux-50/40"
                }`}
              >
                {/* Selection indicator */}
                <div
                  className={`absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200 ${
                    watchedType === type.value
                      ? "bg-bordeaux-500 shadow-md shadow-bordeaux-500/30"
                      : "border border-white/10 bg-zinc-900/10"
                  }`}
                >
                  {watchedType === type.value && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>

                <span className="text-2xl mb-2">{type.icon}</span>
                <span className={`text-sm font-semibold transition-colors ${watchedType === type.value ? "text-foreground" : "text-foreground"}`}>
                  {type.label}
                </span>
                <span className="text-xs text-zinc-500 mt-0.5">
                  {type.desc}
                </span>
              </button>
            ))}
          </div>
          {errors.type && (
            <p className="text-xs text-red-500 pl-1">{errors.type.message}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900/45 px-5 py-3.5 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-bordeaux-200 hover:bg-bordeaux-50/50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Retour
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isLoading || !watchedType}
              className="relative flex-1 rounded-xl bg-gradient-to-r from-bordeaux-800 to-bordeaux-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-bordeaux-500/20 transition-all duration-200 hover:from-bordeaux-600 hover:to-bordeaux-400 hover:shadow-xl hover:shadow-bordeaux-500/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Création en cours...
                </span>
              ) : (
                "Créer mon compte"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Footer link */}
      <p className="mt-8 text-center text-sm text-zinc-400">
        Déjà un compte ?{" "}
        <Link
          href={loginWithNext}
          className="font-semibold text-bordeaux-400 hover:text-bordeaux-300 transition-colors"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">Chargement…</div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
