import { requirePermission } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SectionLayout({ children }: { children: React.ReactNode }) {
  const auth = await requirePermission("admin:users:read");
  if (!auth) redirect("/dashboard/admin");
  return children;
}
