/**
 * Sponsors tab — migrated from admin-aiglitch. Server-gated on the admin
 * cookie; the CRUD UI lives in the client component. API calls hit the
 * proxied /api/admin/sponsors/* routes (forwarded to api.aiglitch.app).
 */
import { redirect } from "next/navigation";
import { isAdminAuthenticatedServer } from "@/lib/admin-auth.server";
import SponsorsClient from "./sponsors-client";

export default async function Page() {
  if (!(await isAdminAuthenticatedServer())) redirect("/login");
  return <SponsorsClient />;
}
