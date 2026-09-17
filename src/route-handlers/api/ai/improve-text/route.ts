import { requirePermission } from "@/lib/auth";
import openai from "@/lib/openai";
import { NextResponse } from "next/server";

// POST /api/ai/improve-text
// Body: { text: string, context: "title" | "objective" | "option" | "headline" | "description" | "cta" }
// Returns: { improved: string, suggestions?: string[] }
export async function POST(req: Request) {
  try {
    const auth = await requirePermission("ai:use");
    if (!auth) return NextResponse.json({ error: "AccÃ¨s refusÃ©" }, { status: 403 });

    const { text, context } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 2) {
      return NextResponse.json(
        { error: "Texte trop court" },
        { status: 400 }
      );
    }

    const contextDescriptions: Record<string, string> = {
      title: "le titre d'une capsule interactive (court, accrocheur)",
      objective: "la question posÃ©e au visiteur dans une capsule (claire, engageante, professionnelle)",
      option: "le label d'un bouton d'option dans une capsule (court, descriptif)",
      headline: "le titre d'une branche de capsule (accrocheur, qui donne envie)",
      description: "la description dÃ©taillÃ©e d'une branche (2-3 phrases, convaincante)",
      cta: "un call-to-action (texte de bouton ou lien, actionnable et direct)",
    };

    const contextDesc = contextDescriptions[context] || "un texte professionnel";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `Tu es un expert en copywriting professionnel. L'utilisateur te donne un texte brut et tu dois :
1. L'amÃ©liorer pour qu'il soit plus professionnel, clair et engageant
2. Proposer 2 alternatives

Le texte est : ${contextDesc}

RÃ©ponds UNIQUEMENT en JSON :
{
  "improved": "version amÃ©liorÃ©e du texte",
  "suggestions": ["alternative 1", "alternative 2"]
}

RÃ¨gles :
- Garde le mÃªme sens et intention
- Tout en franÃ§ais
- Pas de markdown ni explication, uniquement le JSON`,
        },
        {
          role: "user",
          content: text.trim(),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Pas de rÃ©ponse de l'IA" },
        { status: 500 }
      );
    }

    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI IMPROVE TEXT ERROR:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'amÃ©lioration IA" },
      { status: 500 }
    );
  }
}
