import { requirePermission } from "@/lib/auth";
import openai from "@/lib/openai";
import { APIError } from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/ai/generate-capsule
// Body: { description: string }
// Returns: { title, objective, options: [{ label, branch: { headline, description, cta } }] }
export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY manquante. Ajoutez-la dans .env pour utiliser la génération IA." },
        { status: 503 },
      );
    }

    const auth = await requirePermission("ai:use");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const { description } = await req.json();
    if (!description || typeof description !== "string" || description.trim().length < 5) {
      return NextResponse.json(
        { error: "Décrivez votre activité en au moins 5 caractères" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Tu es un expert en création de capsules interactives pour des professionnels.
Une capsule est un parcours interactif : le visiteur voit une question, choisit parmi des options, et chaque option mène vers une branche avec un headline, une description détaillée, et un CTA (call-to-action).

Génère une capsule complète en JSON avec exactement cette structure :
{
  "title": "titre court de la capsule",
  "objective": "question claire posée au visiteur",
  "options": [
    {
      "label": "texte du bouton d'option",
      "branch": {
        "headline": "titre accrocheur de la branche",
        "description": "texte détaillé (2-3 phrases) expliquant cette option",
        "cta": "texte du call-to-action (ex: Prendre rendez-vous, Voir le portfolio, etc.)"
      }
    }
  ]
}

Règles :
- Génère 3 à 4 options pertinentes
- La question (objective) doit être professionnelle et engageante
- Chaque branche doit être unique et détaillée
- Les CTAs doivent être actionnables
- Tout le contenu en français
- Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte autour)`,
        },
        {
          role: "user",
          content: description.trim(),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Pas de réponse de l'IA" },
        { status: 500 }
      );
    }

    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let capsule: unknown;
    try {
      capsule = JSON.parse(jsonStr);
    } catch {
      console.error("AI GENERATE CAPSULE: JSON parse failed, raw:", content.slice(0, 500));
      return NextResponse.json(
        { error: "Réponse IA invalide. Réessayez dans un instant." },
        { status: 502 },
      );
    }

    if (
      !capsule ||
      typeof capsule !== "object" ||
      !("title" in capsule) ||
      !("objective" in capsule) ||
      !("options" in capsule) ||
      !Array.isArray((capsule as { options: unknown }).options)
    ) {
      return NextResponse.json(
        { error: "Structure de réponse invalide" },
        { status: 500 }
      );
    }

    return NextResponse.json(capsule);
  } catch (error) {
    console.error("AI GENERATE CAPSULE ERROR:", error);
    if (error instanceof APIError) {
      return NextResponse.json(
        {
          error:
            error.status === 401
              ? "Clé OpenAI refusée (vérifiez OPENAI_API_KEY)."
              : error.status === 429
                ? "Quota OpenAI dépassé ou limite de débit. Réessayez plus tard."
                : error.message || "Erreur API OpenAI",
        },
        { status: error.status && error.status < 600 ? error.status : 502 },
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la génération IA" },
      { status: 500 }
    );
  }
}
