import { requirePermission } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Server-side gate for the entire private workspace.
 * The client shell may hide navigation items, but this layout is the real
 * authentication boundary for every /dashboard page.
 */
export default async function DashboardAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requirePermission("dashboard:view");
  if (!auth) redirect("/login");
  return children;
}
