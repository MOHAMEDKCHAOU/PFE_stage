import openai from "@/lib/openai";
import { parseTagsFromJson } from "@/lib/identity-profession";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/chatbot — Public (called by visitors on capsule page)
export async function POST(req: NextRequest) {
  try {
    const { message, identityId, history } = await req.json();

    if (!message?.trim() || !identityId) {
      return NextResponse.json({ error: "Message et identityId requis" }, { status: 400 });
    }

    if (message.trim().length > 500) {
      return NextResponse.json({ error: "Message trop long (max 500 caractères)" }, { status: 400 });
    }

    // Validate history format
    const safeHistory: { role: "user" | "assistant"; content: string }[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        if (
          h &&
          typeof h.content === "string" &&
          (h.role === "user" || h.role === "assistant")
        ) {
          safeHistory.push({ role: h.role, content: h.content.slice(0, 500) });
        }
      }
    }

    // Fetch identity with all data for context
    const identity = await prisma.identityProfile.findUnique({
      where: { id: identityId },
      include: {
        capsules: {
          include: {
            options: {
              include: { branch: true },
            },
          },
        },
        portfolioProjects: { where: { isPublic: true }, take: 10 },
        testimonials: { take: 6 },
      },
    });

    if (!identity) {
      return NextResponse.json({ error: "Identité introuvable" }, { status: 404 });
    }

    // Build context for the AI
    const capsuleContext = identity.capsules
      .map((c) => {
        const opts = c.options
          .map((o) => {
            let detail = `  - Option: ${o.label}`;
            if (o.branch) {
              detail += `\n    Headline: ${o.branch.headline}\n    Description: ${o.branch.description}\n    CTA: ${o.branch.cta}`;
              if (o.branch.proof) detail += `\n    Preuve: ${o.branch.proof}`;
            }
            return detail;
          })
          .join("\n");
        return `Capsule "${c.title}": ${c.objective}\n${opts}`;
      })
      .join("\n\n");

    const projectContext = identity.portfolioProjects
      .map((p) => `- ${p.title} (${p.year || "N/A"}): ${p.description}`)
      .join("\n");

    const testimonialContext = identity.testimonials
      .map((t) => `- ${t.author}${t.role ? ` (${t.role})` : ""}${t.company ? ` @ ${t.company}` : ""}: "${t.content}"`)
      .join("\n");

    const systemPrompt = `Tu es l'assistant virtuel de ${identity.name}, un${identity.type === "AGENCY" ? "e agence" : identity.type === "FREELANCER" ? " freelancer" : identity.type === "CREATOR" ? " créateur" : " startup"}.
Tu réponds aux questions des visiteurs de manière professionnelle, amicale et concise.
Tu dois UNIQUEMENT répondre en te basant sur les informations ci-dessous. Si tu ne connais pas la réponse, dis-le poliment et suggère de contacter ${identity.name} via le formulaire de contact.

PROFIL:
- Nom: ${identity.name}
- Type: ${identity.type}
${identity.profession?.trim() ? `- Métier / domaine: ${identity.profession.trim()}` : ""}
${parseTagsFromJson(identity.tags).length ? `- Tags: ${parseTagsFromJson(identity.tags).join(", ")}` : ""}
${identity.headline ? `- Headline: ${identity.headline}` : ""}
${identity.bio ? `- Bio: ${identity.bio}` : ""}

CAPSULES (services/offres):
${capsuleContext || "Aucune capsule configurée."}

${projectContext ? `PORTFOLIO:\n${projectContext}` : ""}

${testimonialContext ? `TÉMOIGNAGES:\n${testimonialContext}` : ""}

RÈGLES:
- Réponds en français par défaut sauf si le visiteur écrit en anglais
- Sois concis (3-4 phrases max)
- Ne fabrique jamais d'informations non présentes ci-dessus
- Si on te demande des prix non mentionnés, dis de contacter directement
- Sois chaleureux et professionnel`;

    let reply: string;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...safeHistory,
          { role: "user", content: message.trim() },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      reply = completion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";
    } catch {
      // AI unavailable — use smart local fallback
      reply = generateLocalReply(message.trim(), identity);
    }

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error("CHATBOT ERROR:", error);

    // Return more specific error info
    const errMsg =
      error instanceof Error ? error.message : "Erreur serveur";
    const status =
      error instanceof Object && "status" in error
        ? (error as { status: number }).status
        : 500;

    return NextResponse.json(
      { error: `Erreur IA: ${errMsg}` },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}

/* ═══════════════════════════════════════════
   Smart local fallback when OpenAI is down
   ═══════════════════════════════════════════ */
type IdentityWithRelations = {
  name: string;
  type: string;
  headline: string | null;
  bio: string | null;
  capsules: {
    title: string;
    objective: string;
    options: {
      label: string;
      branch: { headline: string; description: string; cta: string; proof: string | null } | null;
    }[];
  }[];
  portfolioProjects: { title: string; description: string; year: number | null }[];
  testimonials: { author: string; content: string; role: string | null; company: string | null }[];
};

const typeLabels: Record<string, string> = {
  FREELANCER: "freelancer",
  AGENCY: "agence",
  CREATOR: "créateur",
  STARTUP: "startup",
};

function generateLocalReply(msg: string, identity: IdentityWithRelations): string {
  const q = msg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // ── Greetings ──
  if (/^(bonjour|salut|hello|hi|hey|coucou|bonsoir|yo)\b/.test(q)) {
    const greeting = `Bonjour ! 👋 Je suis l'assistant de ${identity.name}`;
    if (identity.headline) {
      return `${greeting}, ${identity.headline}.\n\nVoici ce que je peux vous présenter :\n• Nos services et offres\n• Notre portfolio\n• Nos témoignages clients\n\nQue souhaitez-vous savoir ?`;
    }
    return `${greeting}.\n\nJe peux vous renseigner sur nos services, projets et compétences. Que souhaitez-vous savoir ?`;
  }

  // ── Who / About ──
  if (/qui (etes|es|est)|about|a propos|presentation|presente/.test(q)) {
    let about = `${identity.name} est un(e) ${typeLabels[identity.type] || identity.type}.`;
    if (identity.headline) about += ` ${identity.headline}.`;
    if (identity.bio) about += `\n\n${identity.bio}`;
    return about;
  }

  // ── Services / Capsules ──
  if (/service|offre|propose|capsule|faire|competence|specialit|expertise/.test(q)) {
    if (identity.capsules.length === 0) {
      return `Les services de ${identity.name} sont en cours de mise à jour. N'hésitez pas à utiliser le formulaire de contact pour en savoir plus !`;
    }
    let reply = `Voici les services proposés par ${identity.name} :\n`;
    for (const c of identity.capsules) {
      reply += `\n🎯 **${c.title}** — ${c.objective}`;
      for (const opt of c.options) {
        reply += `\n  • ${opt.label}`;
        if (opt.branch) reply += ` — ${opt.branch.headline}`;
      }
    }
    reply += `\n\nExplorez les capsules ci-dessus pour plus de détails !`;
    return reply;
  }

  // ── Portfolio / Projects ──
  if (/portfolio|projet|realisation|travaux|work|project/.test(q)) {
    if (identity.portfolioProjects.length === 0) {
      return `Le portfolio de ${identity.name} n'est pas encore disponible ici. Contactez-nous pour voir nos réalisations !`;
    }
    let reply = `Voici les projets de ${identity.name} :\n`;
    for (const p of identity.portfolioProjects) {
      reply += `\n📁 **${p.title}**${p.year ? ` (${p.year})` : ""} — ${p.description}`;
    }
    return reply;
  }

  // ── Testimonials / Reviews ──
  if (/temoign|avis|review|client|retour|feedback|recommand/.test(q)) {
    if (identity.testimonials.length === 0) {
      return `Nous n'avons pas encore de témoignages publiés, mais ${identity.name} sera ravi(e) de vous fournir des références. Utilisez le formulaire de contact !`;
    }
    let reply = `Voici ce que disent les clients de ${identity.name} :\n`;
    for (const t of identity.testimonials) {
      const author = `${t.author}${t.role ? `, ${t.role}` : ""}${t.company ? ` @ ${t.company}` : ""}`;
      reply += `\n⭐ "${t.content}" — *${author}*`;
    }
    return reply;
  }

  // ── Contact ──
  if (/contact|joindre|email|ecrire|appeler|telephone|mail/.test(q)) {
    return `Vous pouvez contacter ${identity.name} directement via le formulaire de contact en bas de cette page. 📩\n\nRemplissez votre nom, email et message, et vous recevrez une réponse rapidement !`;
  }

  // ── Price / Tarif ──
  if (/prix|tarif|cout|combien|devis|budget|price|cost/.test(q)) {
    return `Les tarifs dépendent du projet et de vos besoins spécifiques. Pour obtenir un devis personnalisé, contactez ${identity.name} via le formulaire de contact ci-dessous. 💬`;
  }

  // ── Thanks ──
  if (/merci|thank|thanks/.test(q)) {
    return `Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions. Bonne visite !`;
  }

  // ── Default: suggest topics ──
  const topics: string[] = [];
  if (identity.capsules.length > 0) topics.push("nos **services**");
  if (identity.portfolioProjects.length > 0) topics.push("notre **portfolio**");
  if (identity.testimonials.length > 0) topics.push("les **témoignages** clients");
  topics.push("comment **contacter** " + identity.name);

  return `Je peux vous renseigner sur :\n${topics.map(t => `• ${t}`).join("\n")}\n\nQue souhaitez-vous savoir ? 😊`;
}
