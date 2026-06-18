import { describe, it, expect } from "vitest";
import { ADMIN_COOKIE, COOKIE_MAX_AGE_SECONDS, isAdminAuthenticated } from "./admin-auth";

describe("admin auth (client helpers)", () => {
  it("uses the shared ecosystem cookie name", () => {
    // Must match what api.aiglitch.app sets (scoped to .aiglitch.app) so
    // SSO works across admin / marketing / trading subdomains.
    expect(ADMIN_COOKIE).toBe("aiglitch-admin-token");
  });

  it("keeps the 7-day cookie lifetime", () => {
    expect(COOKIE_MAX_AGE_SECONDS).toBe(7 * 24 * 60 * 60);
  });

  it("returns false in a non-browser (no document) context", () => {
    expect(isAdminAuthenticated()).toBe(false);
  });
});
