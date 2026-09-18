import { requirePermission } from "@/lib/auth";
import openai from "@/lib/openai";
import { NextResponse } from "next/server";

// POST /api/ai/insights
// Body: { analytics: CapsuleAnalytics }
// Returns: { insights: string[] }
export async function POST(req: Request) {
  try {
    const auth = await requirePermission("ai:use");
    if (!auth) return NextResponse.json({ error: "AccÃƒÂ¨s refusÃƒÂ©" }, { status: 403 });

    const { analytics } = await req.json();
    if (!analytics) {
      return NextResponse.json(
        { error: "DonnÃƒÂ©es analytics requises" },
        { status: 400 }
      );
    }

    const completion = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: `Tu es un expert en analyse de donnÃƒÂ©es et optimisation de conversion. 
L'utilisateur te donne les analytics d'une capsule interactive (parcours visiteur). Analyse les donnÃƒÂ©es et donne des insights actionnables.

RÃƒÂ©ponds UNIQUEMENT en JSON :
{
  "insights": [
    "insight 1 Ã¢â‚¬â€ conseil actionnable",
    "insight 2 Ã¢â‚¬â€ conseil actionnable",
    "insight 3 Ã¢â‚¬â€ conseil actionnable"
  ]
}

RÃƒÂ¨gles :
- Donne 3 ÃƒÂ  5 insights pertinents basÃƒÂ©s sur les donnÃƒÂ©es
- Chaque insight doit ÃƒÂªtre concis (1-2 phrases max)
- Inclus des chiffres quand pertinent
- Sois spÃƒÂ©cifique et actionnable, pas gÃƒÂ©nÃƒÂ©rique
- Si les donnÃƒÂ©es sont insuffisantes (0 visiteurs), dis-le
- Tout en franÃƒÂ§ais
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
        { error: "Pas de rÃƒÂ©ponse de l'IA" },
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

