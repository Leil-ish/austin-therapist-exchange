"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { createPortal } from "react-dom";

import { signOut } from "@/app-actions/auth-actions";
import { getInitials } from "@/components/ui/avatar";

type NavItem = { href: Route; label: string };

export function MobileNav({
  navItems,
  isSignedIn,
  fullName,
  avatarUrl,
  unreadNotificationCount,
  isAdmin,
}: {
  navItems: readonly NavItem[];
  isSignedIn: boolean;
  fullName?: string;
  avatarUrl?: string;
  unreadNotificationCount?: number;
  isAdmin?: boolean;
}) {
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

      {open && createPortal(
        <>
          {/* Backdrop — portalled to body so header's backdrop-filter doesn't trap fixed position */}
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

            {fullName && (
              <div className="flex items-center gap-3 border-b border-primary/10 px-6 py-4">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {getInitials(fullName)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{fullName}</p>
                  <Link
                    href="/member/profile"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    Edit profile
                  </Link>
                  <Link
                    href="/member/change-password"
                    className="mt-0.5 block text-xs text-primary hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    Change password
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin/join-requests"
                      className="mt-0.5 block text-xs text-primary hover:underline"
                      onClick={() => setOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-1 p-4">
              {navItems.map((item) => (
                <Link
                  className="relative flex items-center rounded-lg px-4 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                  href={item.href}
                  key={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                  {item.href === "/member/notifications" && (unreadNotificationCount ?? 0) > 0 && (
                    <span className="ml-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                      {unreadNotificationCount}
                    </span>
                  )}
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
        </>,
        document.body
      )}
    </div>
  );
}
