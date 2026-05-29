"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";

import { signOut } from "@/app-actions/auth-actions";

type NavItem = { href: Route; label: string };

export function MobileNav({ navItems, isSignedIn }: { navItems: readonly NavItem[]; isSignedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        aria-expanded={open}
        aria-label="Open navigation menu"
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-40 flex w-72 flex-col bg-[rgba(255,251,245,0.98)] shadow-xl">
            <div className="flex items-center justify-between border-b border-primary/10 px-6 py-4">
              <span className="font-serif text-lg">Menu</span>
              <button
                aria-label="Close navigation menu"
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 p-4">
              {navItems.map((item) => (
                <Link
                  className="rounded-lg px-4 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                  href={item.href}
                  key={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-primary/10 p-4">
              {isSignedIn ? (
                <form action={signOut}>
                  <button
                    className="w-full rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                    type="submit"
                  >
                    Sign out
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    className="rounded-lg px-4 py-3 text-center text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                    href="/login"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm font-medium text-foreground hover:bg-primary/10"
                    href="/join/apply"
                    onClick={() => setOpen(false)}
                  >
                    Request access
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
