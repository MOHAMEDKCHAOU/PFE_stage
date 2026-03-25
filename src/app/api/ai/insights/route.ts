import { getUserId } from "@/lib/auth";
import openai from "@/lib/openai";
import { NextResponse } from "next/server";

// POST /api/ai/insights
// Body: { analytics: CapsuleAnalytics }
// Returns: { insights: string[] }
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { analytics } = await req.json();
    if (!analytics) {
      return NextResponse.json(
        { error: "Données analytics requises" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: `Tu es un expert en analyse de données et optimisation de conversion. 
L'utilisateur te donne les analytics d'une capsule interactive (parcours visiteur). Analyse les données et donne des insights actionnables.

Réponds UNIQUEMENT en JSON :
{
  "insights": [
    "insight 1 — conseil actionnable",
    "insight 2 — conseil actionnable",
    "insight 3 — conseil actionnable"
  ]
}

Règles :
- Donne 3 à 5 insights pertinents basés sur les données
- Chaque insight doit être concis (1-2 phrases max)
- Inclus des chiffres quand pertinent
- Sois spécifique et actionnable, pas générique
- Si les données sont insuffisantes (0 visiteurs), dis-le
- Tout en français
- Pas de markdown, uniquement le JSON`,
        },
        {
          role: "user",
          content: JSON.stringify(analytics),
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
    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI INSIGHTS ERROR:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse IA" },
      { status: 500 }
    );
  }
}
