/**
 * Contact tab — migrated from admin-aiglitch (admin /contacts). Server-
 * gated on the admin cookie. Unlike the admin version (which fetched the
 * list server-side and broke in production), the client fetches its own
 * data from the proxied /api/admin/contacts route.
 */
import { redirect } from "next/navigation";
import { isAdminAuthenticatedServer } from "@/lib/admin-auth.server";
import { ContactsClient } from "./contact-client";

export default async function Page() {
  if (!(await isAdminAuthenticatedServer())) redirect("/login");
  return (
    <div>
      <h1 className="text-2xl font-black mb-1">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          Contacts
        </span>
      </h1>
      <p className="text-gray-500 text-sm mb-5">
        Outreach contact list — used by persona email campaigns.
      </p>
      <ContactsClient />
    </div>
  );
}
