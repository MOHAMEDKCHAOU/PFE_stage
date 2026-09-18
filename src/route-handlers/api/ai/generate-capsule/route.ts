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
        { error: "OPENAI_API_KEY manquante. Ajoutez-la dans .env pour utiliser la gÃƒÂ©nÃƒÂ©ration IA." },
        { status: 503 },
      );
    }

    const auth = await requirePermission("ai:use");
    if (!auth) return NextResponse.json({ error: "AccÃƒÂ¨s refusÃƒÂ©" }, { status: 403 });

    const { description } = await req.json();
    if (!description || typeof description !== "string" || description.trim().length < 5) {
      return NextResponse.json(
        { error: "DÃƒÂ©crivez votre activitÃƒÂ© en au moins 5 caractÃƒÂ¨res" },
        { status: 400 }
      );
    }

    const completion = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Tu es un expert en crÃƒÂ©ation de capsules interactives pour des professionnels.
Une capsule est un parcours interactif : le visiteur voit une question, choisit parmi des options, et chaque option mÃƒÂ¨ne vers une branche avec un headline, une description dÃƒÂ©taillÃƒÂ©e, et un CTA (call-to-action).

GÃƒÂ©nÃƒÂ¨re une capsule complÃƒÂ¨te en JSON avec exactement cette structure :
{
  "title": "titre court de la capsule",
  "objective": "question claire posÃƒÂ©e au visiteur",
  "options": [
    {
      "label": "texte du bouton d'option",
      "branch": {
        "headline": "titre accrocheur de la branche",
        "description": "texte dÃƒÂ©taillÃƒÂ© (2-3 phrases) expliquant cette option",
        "cta": "texte du call-to-action (ex: Prendre rendez-vous, Voir le portfolio, etc.)"
      }
    }
  ]
}

RÃƒÂ¨gles :
- GÃƒÂ©nÃƒÂ¨re 3 ÃƒÂ  4 options pertinentes
- La question (objective) doit ÃƒÂªtre professionnelle et engageante
- Chaque branche doit ÃƒÂªtre unique et dÃƒÂ©taillÃƒÂ©e
- Les CTAs doivent ÃƒÂªtre actionnables
- Tout le contenu en franÃƒÂ§ais
- RÃƒÂ©ponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte autour)`,
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
        { error: "Pas de rÃƒÂ©ponse de l'IA" },
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
        { error: "RÃƒÂ©ponse IA invalide. RÃƒÂ©essayez dans un instant." },
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
        { error: "Structure de rÃƒÂ©ponse invalide" },
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
              ? "ClÃƒÂ© OpenAI refusÃƒÂ©e (vÃƒÂ©rifiez OPENAI_API_KEY)."
              : error.status === 429
                ? "Quota OpenAI dÃƒÂ©passÃƒÂ© ou limite de dÃƒÂ©bit. RÃƒÂ©essayez plus tard."
                : error.message || "Erreur API OpenAI",
        },
        { status: error.status && error.status < 600 ? error.status : 502 },
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la gÃƒÂ©nÃƒÂ©ration IA" },
      { status: 500 }
    );
  }
}





