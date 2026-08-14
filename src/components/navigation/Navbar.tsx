"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/deals/DEAL-B2B-101", label: "Sample Deal" },
    { href: "/escrow", label: "Escrow Terminal" },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="mx-auto max-w-5xl flex items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-wider text-teal-400">
          TRADEIT <span className="text-xs font-semibold text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">B2B</span>
        </Link>

        <div className="flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-4 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}