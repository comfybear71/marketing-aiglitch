"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NAV } from "./nav";
import { ECOSYSTEM_LINKS } from "@/lib/ecosystem-urls";

/** Routes that render WITHOUT the shell (no sidebar / header). */
const SHELL_SUPPRESSED_PATHS = new Set(["/login"]);

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (SHELL_SUPPRESSED_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  return <MarketingShellInner pathname={pathname}>{children}</MarketingShellInner>;
}

function MarketingShellInner({
  children,
  pathname,
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Active tab = first path segment, e.g. "/ad-creator" -> "ad-creator".
  const activeSlug = pathname.split("/")[1] || "";

  const go = (slug: string) => {
    setMobileOpen(false);
    router.push(`/${slug}`);
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/admin", { method: "DELETE", credentials: "include" });
    } catch {
      /* network error — fall through to redirect anyway */
    }
    window.location.href = "/login";
  };

  const navButtons = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = activeSlug === item.slug;
        return (
          <button
            key={item.slug}
            type="button"
            onClick={() => go(item.slug)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-left transition-all ${
              active
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-gray-400 border border-transparent hover:bg-gray-800/70 hover:text-gray-200"
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  const ecosystemLinks = (
    <div className="flex flex-col gap-2">
      {ECOSYSTEM_LINKS.map((link) => (
        <a
          key={link.id}
          href={link.href}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-700"
        >
          <span>{link.icon}</span>
          {link.label}
        </a>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-50 flex items-center justify-between bg-gray-900/80 border-b border-gray-800 backdrop-blur-xl px-3 py-2">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation"
          className="px-2.5 py-1.5 bg-gray-800 text-gray-200 rounded-lg text-sm font-bold"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
        <Brand />
        <button
          type="button"
          onClick={signOut}
          className="px-2.5 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20"
        >
          {"\u{1F6AA}"}
        </button>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:h-screen md:sticky md:top-0 border-r border-gray-800 bg-gray-900/40 p-4">
          <div className="px-1 pb-5">
            <Brand />
          </div>
          {navButtons}
          <div className="mt-auto pt-5 flex flex-col gap-2">
            {ecosystemLinks}
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20"
            >
              {"\u{1F6AA}"} Sign out
            </button>
          </div>
        </aside>

        {/* Mobile slide-down drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-x-0 top-[49px] z-40 bg-gray-950/95 border-b border-gray-800 backdrop-blur-xl p-4 animate-slide-up">
            {navButtons}
            <div className="mt-4 pt-4 border-t border-gray-800">
              {ecosystemLinks}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">{"\u{1F4E3}"}</span>
      <h1 className="text-base font-black whitespace-nowrap">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          AIG!itch
        </span>
        <span className="text-gray-400 ml-1.5 text-xs font-normal">Marketing</span>
      </h1>
    </div>
  );
}
