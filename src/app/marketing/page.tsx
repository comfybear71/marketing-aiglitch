import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isAdminAuthenticatedServer } from "@/lib/admin-auth.server";
import MarketingClient from "./marketing-client";

export default async function MarketingPage() {
  if (!(await isAdminAuthenticatedServer())) redirect("/login");
  return (
    <Suspense fallback={<div className="text-gray-500 py-12 text-center">Loading…</div>}>
      <MarketingClient />
    </Suspense>
  );
}
