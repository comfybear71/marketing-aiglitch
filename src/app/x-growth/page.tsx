/**
 * "x-growth" tab — placeholder for this session. Real UI lands later.
 * Server-gated on the admin cookie; unauthenticated visitors go to /login.
 */
import { redirect } from "next/navigation";
import { isAdminAuthenticatedServer } from "@/lib/admin-auth.server";
import { Placeholder } from "@/components/Placeholder";
import { navItemForSlug } from "../nav";

export default async function Page() {
  if (!(await isAdminAuthenticatedServer())) redirect("/login");
  const item = navItemForSlug("x-growth")!;
  return <Placeholder icon={item.icon} title={item.label} />;
}
