import { requireAnyPermission } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAnyPermission([
    "admin:stats:read",
    "admin:users:read",
    "admin:capsules:moderate",
    "admin:badges:manage",
    "admin:audit:read",
  ]);

  if (!auth) redirect("/dashboard");
  return children;
}
