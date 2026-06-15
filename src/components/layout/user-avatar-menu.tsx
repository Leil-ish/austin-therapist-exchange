"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { signOut } from "@/app-actions/auth-actions";

function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function UserAvatarMenu({ fullName, email }: { fullName: string | null; email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background transition-opacity hover:opacity-85"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {getInitials(fullName, email)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-30 min-w-[11rem] overflow-hidden rounded-[20px] bg-card shadow-paper-hover"
        >
          <Link
            className="block px-4 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-muted/50 hover:text-foreground"
            href="/member/profile"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            Edit profile
          </Link>
          <div className="mx-3 h-px bg-border/40" />
          <form action={signOut}>
            <button
              className="w-full px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              role="menuitem"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
