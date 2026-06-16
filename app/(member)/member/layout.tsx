import { requireMember } from "@/lib/auth/guards";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  await requireMember();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
