import { requirePermission } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const auth = await requirePermission("studio:access");
  if (!auth) redirect("/dashboard");
  return children;
}
