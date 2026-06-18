/**
 * "ad-creator" tab — placeholder for this session. Real UI lands later.
 * Server-gated on the admin cookie; unauthenticated visitors go to /login.
 */
import { redirect } from "next/navigation";
import { isAdminAuthenticatedServer } from "@/lib/admin-auth.server";
import { Placeholder } from "@/components/Placeholder";
import { navItemForSlug } from "../nav";

export default async function Page() {
  if (!(await isAdminAuthenticatedServer())) redirect("/login");
  const item = navItemForSlug("ad-creator")!;
  return <Placeholder icon={item.icon} title={item.label} note="THE headline feature — Ad Creator UI lands in marketing session 2, on top of the /api/admin/ads/* backend (aiglitch-api v1.53.0)." />;
}
