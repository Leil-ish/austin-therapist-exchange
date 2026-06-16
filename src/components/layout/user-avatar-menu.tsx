"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { signOut } from "@/app-actions/auth-actions";
import { Avatar } from "@/components/ui/avatar";

export function UserAvatarMenu({
  fullName,
  email,
  avatarUrl,
}: {
  fullName: string | null;
  email: string;
  avatarUrl?: string;
}) {
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

  const name = fullName?.trim() || email;

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full transition-opacity hover:opacity-85"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <Avatar
          avatarUrl={avatarUrl}
          name={name}
          size="sm"
          fallbackClassName="bg-foreground text-xs font-semibold text-background w-full h-full"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-30 min-w-[11rem] overflow-hidden rounded-[20px] bg-card shadow-paper-hover"
        >
          {fullName && (
            <p className="truncate px-4 pt-3 pb-1 text-xs font-medium text-foreground/60">
              {fullName}
            </p>
          )}
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
