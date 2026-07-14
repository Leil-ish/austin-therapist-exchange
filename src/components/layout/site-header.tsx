import Link from "next/link";

import { Bell } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getIncomingReferrals } from "@/lib/data/referral-tracking";
import { getUnreadNotificationCount } from "@/lib/data/live-data";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { UserAvatarMenu } from "./user-avatar-menu";

const publicNav = [
  { href: "/directory", label: "Directory" },
  { href: "/about", label: "How it works" }
] as const;

const memberNav = [
  { href: "/member/referrals", label: "Referrals" },
  { href: "/member/network", label: "Network" },
  { href: "/directory", label: "Directory" },
  { href: "/member/notifications", label: "Notifications" }
] as const;

export async function SiteHeader() {
  const session = await getSession();
  const navItems = session ? memberNav : publicNav;

  const [unreadReferralCount, unreadNotificationCount] = await Promise.all([
    session
      ? getIncomingReferrals(session.userId).then((r) => r.filter((x) => x.status === "open").length)
      : Promise.resolve(0),
    session ? getUnreadNotificationCount(session.userId) : Promise.resolve(0),
  ]);

  return (
    <header className="sticky top-0 z-20 border-b border-primary/10 bg-[rgba(255,251,245,0.9)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link className="flex items-center gap-3" href="/">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/15 bg-white/85 shadow-paper">
            <svg aria-hidden="true" className="h-10 w-10" viewBox="0 0 64 64">
              <path d="M23 11c8 0 14 6 14 14S31 39 23 39 9 33 9 25s6-14 14-14Z" fill="none" stroke="#146f73" strokeWidth="5" strokeLinecap="round" strokeDasharray="76 18" />
              <path d="M41 11c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14Z" fill="none" stroke="#f7a141" strokeWidth="5" strokeLinecap="round" strokeDasharray="76 18" />
              <path d="M32 25c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14Z" fill="none" stroke="#e25f1c" strokeWidth="5" strokeLinecap="round" strokeDasharray="76 18" />
            </svg>
          </div>
          <div>
            <p className="font-serif text-[1.45rem] leading-none tracking-[0.01em]">Austin Therapist Exchange</p>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Referrals for Austin therapists</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => {
            if (item.href === "/member/notifications") return null;
            return (
              <Link className="relative text-sm text-muted-foreground hover:text-foreground" href={item.href} key={item.href}>
                {item.label}
                {item.href === "/member/referrals" && unreadReferralCount > 0 && (
                  <span className="absolute -top-2 -right-3 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                    {unreadReferralCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
            {session && (
              <Link href="/member/notifications" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                    {unreadNotificationCount}
                  </span>
                )}
              </Link>
            )}
            {session ? (
              <UserAvatarMenu fullName={session.fullName} email={session.email} avatarUrl={session.avatarUrl} />
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/join/apply">Request access</Link>
                </Button>
              </>
            )}
          </div>
          <MobileNav
            isSignedIn={!!session}
            navItems={navItems}
            fullName={session?.fullName ?? undefined}
            avatarUrl={session?.avatarUrl ?? undefined}
            unreadNotificationCount={unreadNotificationCount}
          />
        </div>
      </div>
    </header>
  );
}
