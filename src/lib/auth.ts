import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("faymoos_session");
  return session?.value || null;
}

export async function requireAdmin(): Promise<string | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") return null;
  return userId;
}

/** Session utilisateur avec rôle affilié (Studio). */
export async function requireAffiliate(): Promise<string | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "AFFILIATE") return null;
  return userId;
}
