import { cookies } from "next/headers";

export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("faymoos_session");
  return session?.value || null;
}
