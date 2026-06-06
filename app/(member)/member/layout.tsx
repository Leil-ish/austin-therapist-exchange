import Link from "next/link";

import { requireMember } from "@/lib/auth/guards";

const memberNav = [
  { href: "/member/referrals", label: "Referrals" },
  { href: "/member/network", label: "Network" },
  { href: "/member/profile", label: "Profile" },
  { href: "/directory", label: "Directory" }
] as const;

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await requireMember();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-5 rounded-2xl border bg-white/85 p-6 shadow-soft md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Member workspace</p>
            <h1 className="font-serif text-4xl">Private referral network</h1>
            <p className="mt-2 text-sm text-muted-foreground">{session.fullName} · {session.membershipTier}</p>
          </div>
          <nav className="flex flex-wrap gap-3">
            {memberNav.map((item) => (
              <Link
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                href={item.href as never}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
