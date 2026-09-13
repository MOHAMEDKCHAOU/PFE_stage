import { writeAuditLog } from "@/lib/audit";
import { getAuthContext, revokeCurrentSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  const auth = await getAuthContext();
  await revokeCurrentSession();
  if (auth) {
    await writeAuditLog({
      actorUserId: auth.userId,
      action: "AUTH_LOGOUT",
      targetType: "User",
      targetId: auth.userId,
    });
  }
  return NextResponse.json({ message: "Déconnexion réussie" });
}
