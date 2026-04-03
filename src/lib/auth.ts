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

export async function requireAffiliateur(): Promise<string | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "AFFILIATEUR") return null;
  return userId;
}
