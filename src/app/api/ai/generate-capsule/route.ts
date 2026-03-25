import { getUserId } from "@/lib/auth";
import openai from "@/lib/openai";
import { NextResponse } from "next/server";

// POST /api/ai/generate-capsule
// Body: { description: string }
// Returns: { title, objective, options: [{ label, branch: { headline, description, cta } }] }
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

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
- Réponds UNIQUEMENT avec le JSON, sans markdown ni explication`,
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

    // Parse JSON from response (handle possible markdown code blocks)
    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const capsule = JSON.parse(jsonStr);

    // Validate structure
    if (!capsule.title || !capsule.objective || !Array.isArray(capsule.options)) {
      return NextResponse.json(
        { error: "Structure de réponse invalide" },
        { status: 500 }
      );
    }

    return NextResponse.json(capsule);
  } catch (error) {
    console.error("AI GENERATE CAPSULE ERROR:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération IA" },
      { status: 500 }
    );
  }
}
