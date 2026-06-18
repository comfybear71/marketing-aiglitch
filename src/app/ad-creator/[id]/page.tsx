/**
 * Ad Creator — single brief detail. Server-gated on the admin cookie;
 * edit / assets / generate / diagnostics all live in the client.
 */
import { redirect } from "next/navigation";
import { isAdminAuthenticatedServer } from "@/lib/admin-auth.server";
import { BriefDetailClient } from "./brief-detail-client";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminAuthenticatedServer())) redirect("/login");
  const { id } = await params;
  return <BriefDetailClient briefId={id} />;
}
