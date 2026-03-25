import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/analytics/track — Public (called by capsule visitors)
// Creates sessions and logs events
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, capsuleId, sessionId, optionId, optionLabel } = body;

    if (!action || !capsuleId) {
      return NextResponse.json(
        { error: "action et capsuleId requis" },
        { status: 400 }
      );
    }

    // Verify capsule exists
    const capsule = await prisma.capsule.findUnique({
      where: { id: capsuleId },
    });
    if (!capsule) {
      return NextResponse.json(
        { error: "Capsule introuvable" },
        { status: 404 }
      );
    }

    // START → create session + START event
    if (action === "START") {
      const session = await prisma.capsuleSession.create({
        data: {
          capsuleId,
          events: {
            create: {
              type: "START",
              value: null,
            },
          },
        },
      });
      return NextResponse.json({ sessionId: session.id }, { status: 201 });
    }

    // OPTION_CLICK or CTA_CLICK → add event to existing session
    if (
      (action === "OPTION_CLICK" || action === "CTA_CLICK") &&
      sessionId
    ) {
      const session = await prisma.capsuleSession.findUnique({
        where: { id: sessionId },
      });
      if (!session) {
        return NextResponse.json(
          { error: "Session introuvable" },
          { status: 404 }
        );
      }

      const event = await prisma.capsuleEvent.create({
        data: {
          sessionId,
          type: action,
          value:
            action === "OPTION_CLICK"
              ? optionLabel || optionId || null
              : optionLabel || null,
        },
      });

      // If CTA_CLICK → mark session as ended (completed)
      if (action === "CTA_CLICK") {
        await prisma.capsuleSession.update({
          where: { id: sessionId },
          data: { endedAt: new Date() },
        });
      }

      return NextResponse.json({ eventId: event.id }, { status: 201 });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    console.error("TRACK ANALYTICS ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
