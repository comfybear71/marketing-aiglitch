/**
 * Ad Creator — brief list. Server-gated on the admin cookie; the list,
 * filters, and create form live in the client component.
 */
import { redirect } from "next/navigation";
import { isAdminAuthenticatedServer } from "@/lib/admin-auth.server";
import { AdCreatorClient } from "./ad-creator-client";

export default async function Page() {
  if (!(await isAdminAuthenticatedServer())) redirect("/login");
  return <AdCreatorClient />;
}
