"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dispatch", label: "Dispatch" },
  { href: "/proof-lab", label: "Proof Lab" },
  { href: "/catalog", label: "Catalog" },
  { href: "/verify", label: "Verify" },
  { href: "/about", label: "About" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-3.5 sm:px-6">
      <div className="mx-auto flex h-13 max-w-6xl items-center justify-between rounded-full border border-border-strong/80 bg-surface/90 px-4.5 shadow-xs backdrop-blur-md">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 text-[14px] font-semibold tracking-tight text-ink">
          <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-accent" />
          HIREWALL
        </Link>

        {/* Desktop Navigation Links */}
        <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                  active ? "bg-canvas text-ink font-semibold" : "text-ink-muted hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA Button */}
        <div className="flex items-center gap-2">
          <Link
            href="/dispatch"
            className="rounded-full bg-accent px-4 py-1.5 text-[13px] font-semibold text-accent-foreground shadow-xs transition hover:bg-accent-strong"
          >
            Dispatch a task
          </Link>
        </div>
      </div>

      {/* Mobile nav bar */}
      <nav aria-label="Primary mobile" className="mt-2 flex items-center justify-center gap-1 overflow-x-auto rounded-full border border-border bg-surface/95 px-3 py-1 shadow-xs backdrop-blur-md sm:hidden">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium transition ${
                active ? "bg-canvas font-semibold text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
