"use client";

/* eslint-disable @next/next/no-img-element -- Identity covers & avatars from API */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditProfileModal } from "@/components/EditProfileModal";
import { StudioInviteInbox } from "@/components/StudioInviteInbox";
import { StudioPartnersPanel } from "@/components/StudioPartnersPanel";
import { parseTagsFromJson } from "@/lib/identity-profession";

type IdentityProfile = {
  id: string;
  name: string;
  slug: string;
  type: string;
  bio: string | null;
  headline: string | null;
  avatar: string | null;
  cover: string | null;
  theme: string | null;
  socialLinks: Record<string, string> | null;
  hideBranding?: boolean;
  profession?: string | null;
  tags?: unknown;
  ctaWebhookUrl?: string | null;
  ctaWebhookSecret?: string | null;
  hasCtaWebhookSecret?: boolean;
  createdAt: string;
  _count: {
    portfolioProjects: number;
    testimonials: number;
    capsules: number;
  };
};

type UserData = {
  id: string;
  email: string;
  createdAt: string;
  identityProfiles: IdentityProfile[];
  billing?: { canHideBranding?: boolean } | null;
};

const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
  FREELANCER: { label: "Freelancer", icon: "💼", color: "bg-[#C6A15B]/15 text-[#C6A15B] ring-[#C6A15B]/25" },
  AGENCY: { label: "Agence", icon: "🏢", color: "bg-[#C6A15B]/15 text-[#C6A15B] ring-[#C6A15B]/25" },
  CREATOR: { label: "Créateur", icon: "🎨", color: "bg-[#C6A15B]/15 text-[#C6A15B] ring-[#C6A15B]/25" },
  STARTUP: { label: "Startup", icon: "🚀", color: "bg-[#C6A15B]/15 text-[#C6A15B] ring-[#C6A15B]/25" },
  USER: { label: "Utilisateur", icon: "👤", color: "bg-[#0B0D10]/8 text-muted-foreground ring-white/12" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<IdentityProfile | null>(null);
  const [partnersReloadKey, setPartnersReloadKey] = useState(0);

  async function fetchUser() {
    try {
      const res = await fetch("/api/me");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleProfileUpdated() {
    setEditingProfile(null);
    fetchUser();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalProjects = user.identityProfiles.reduce((acc, p) => acc + p._count.portfolioProjects, 0);
  const totalCapsules = user.identityProfiles.reduce((acc, p) => acc + p._count.capsules, 0);
  const totalTestimonials = user.identityProfiles.reduce((acc, p) => acc + p._count.testimonials, 0);
  const mainProfile = user.identityProfiles[0];
  const memberSince = new Date(user.createdAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const stats = [
    {
      label: "Identités",
      value: user.identityProfiles.length,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      color: "border-border bg-gradient-to-br from-[#C6A15B]/18 via-transparent to-transparent",
      iconBg: "bg-[#C6A15B]/20 text-[#C6A15B]",
    },
    {
      label: "Capsules",
      value: totalCapsules,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
      color: "border-border bg-gradient-to-br from-[#C6A15B] via-transparent to-transparent",
      iconBg: "bg-[#C6A15B]/20 text-[#C6A15B]",
    },
    {
      label: "Projets",
      value: totalProjects,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      ),
      color: "border-border bg-gradient-to-br from-[#C6A15B] via-transparent to-transparent",
      iconBg: "bg-[#C6A15B]/20 text-[#C6A15B]",
    },
    {
      label: "Témoignages",
      value: totalTestimonials,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ),
      color: "border-border bg-gradient-to-br from-[#C6A15B] via-transparent to-transparent",
      iconBg: "bg-[#C6A15B]/20 text-[#C6A15B]",
    },
  ];

  return (
    <div className="space-y-8 animate-in">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Bonjour, {mainProfile?.name || "Utilisateur"} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Membre depuis {memberSince} &middot; {user.email}
          </p>
        </div>
        <a
          href={mainProfile ? `/capsule/${mainProfile.slug}` : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="dash-link"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Voir ma capsule
        </a>
      </div>

      <StudioInviteInbox
        onAccepted={() => {
          fetchUser();
          setPartnersReloadKey((k) => k + 1);
        }}
      />

      <StudioPartnersPanel reloadKey={partnersReloadKey} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm ${stat.color}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{stat.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Identity Profiles */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">Mes Identités</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-accent/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/35 hover:bg-accent-strong hover:text-foreground"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nouvelle identité
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {user.identityProfiles.map((profile) => {
            const typeInfo = typeLabels[profile.type] || typeLabels.USER;
            return (
              <div
                key={profile.id}
                className="dash-card dash-card-interactive group relative p-5 transition-all duration-200"
              >
                {/* Cover image or gradient */}
                {profile.cover ? (
                  <div className="absolute inset-x-0 top-0 h-24 rounded-t-[15px] overflow-hidden">
                    <img src={profile.cover} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
                  </div>
                ) : (
                  <div className="absolute inset-x-0 top-0 h-20 rounded-t-[15px] bg-gradient-to-br from-primary/25 via-[#C6A15B] to-transparent" />
                )}

                <div className="relative">
                  {/* Avatar + actions row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#C6A15B] to-[#C6A15B] text-2xl font-bold text-white shadow-lg shadow-[#C6A15B]/20 ring-4 ring-border overflow-hidden">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                      ) : (
                        profile.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(profile)}
                      className="dash-btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                  </div>

                  {/* Name & type */}
                  <h3 className="text-base font-semibold text-foreground">{profile.name}</h3>
                  {profile.headline && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{profile.headline}</p>
                  )}
                  {profile.profession?.trim() && (
                    <p className="mt-1 text-xs font-medium text-primary">{profile.profession.trim()}</p>
                  )}
                  {(() => {
                    const tl = parseTagsFromJson(profile.tags);
                    if (tl.length === 0) return null;
                    return (
                      <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{tl.slice(0, 6).join(" · ")}</p>
                    );
                  })()}

                  <div className="mt-3 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${typeInfo.color}`}>
                      <span>{typeInfo.icon}</span>
                      {typeInfo.label}
                    </span>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  {/* Stats row */}
                  <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                      {profile._count.portfolioProjects} projets
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                      </svg>
                      {profile._count.capsules} capsules
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                      {profile._count.testimonials}
                    </div>
                  </div>

                  {/* Slug / link */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-mono truncate">
                      faymoos.com/capsule/{profile.slug}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/capsule/${profile.slug}`)}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                      title="Copier le lien"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editingProfile && (
        <EditProfileModal
          profile={editingProfile}
          ownerCanHideBranding={user?.billing?.canHideBranding ?? false}
          onClose={() => setEditingProfile(null)}
          onSaved={handleProfileUpdated}
        />
      )}
    </div>
  );
}
