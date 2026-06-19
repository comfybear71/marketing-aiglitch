/**
 * "ai-costs" tab — migrated from admin-aiglitch. Server-gated on the admin
 * cookie; the UI + data fetching live in the client component. API calls
 * hit the proxied /api/admin/* routes (forwarded to api.aiglitch.app).
 */
import { redirect } from "next/navigation";
import { isAdminAuthenticatedServer } from "@/lib/admin-auth.server";
import AiCostsClient from "./ai-costs-client";

export default async function Page() {
  if (!(await isAdminAuthenticatedServer())) redirect("/login");
  return <AiCostsClient />;
}
