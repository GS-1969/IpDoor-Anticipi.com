"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/",          label: "Incassi Settimanali" },
  { href: "/riepilogo", label: "Riepilogo" },
  { href: "/clienti",   label: "Clienti" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-brand-700 grid place-items-center">
            <span className="text-white text-[11px] font-bold tracking-tight">€</span>
          </div>
          <span className="font-semibold text-zinc-900">Pianificazione Incassi</span>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${active
                    ? "bg-brand-50 text-brand-700"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
