/**
 * Root — there's no standalone "home" yet. Gate on the admin cookie,
 * then bounce to the default tab (Ad Creator). Unauthenticated visitors
 * go to /login.
 */
import { redirect } from "next/navigation";
import { isAdminAuthenticatedServer } from "@/lib/admin-auth.server";
import { DEFAULT_SLUG } from "./nav";

export default async function Home() {
  const ok = await isAdminAuthenticatedServer();
  redirect(ok ? `/${DEFAULT_SLUG}` : "/login");
}
