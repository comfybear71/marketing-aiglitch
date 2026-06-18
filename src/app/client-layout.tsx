"use client";

import { MarketingShell } from "./marketing-shell";

/**
 * Client boundary for the app shell. Kept as a thin wrapper (mirrors
 * admin-aiglitch) so we have an obvious place to add context providers
 * when the first real tab lands.
 */
export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
