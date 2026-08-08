import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/state/empty-state";
import { DirectoryFilters } from "@/components/domain/directory-filters";
import { TherapistCard } from "@/components/domain/therapist-card";
import { requireMember } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { getPublicTherapists } from "@/lib/data/live-data";
import { regionMatches } from "@/lib/referral-matching";

export default async function DirectoryPage({
  searchParams
}: {
    searchParams?: Promise<{
      q?: string;
      region?: string;
      availability?: string;
      payment?: string;
      format?: string;
      page?: string;
  }>;
}) {
  if (!(await getSession())) {
    redirect("/login?returnTo=/member/referrals");
  }

  const params = searchParams ? await searchParams : undefined;
  const session = await requireMember("/directory");

  const query = params?.q?.trim() ?? "";
  const region = params?.region?.trim() ?? "";
  const availability = params?.availability?.trim() ?? "";
  const payment = params?.payment?.trim() ?? "";
  const format = params?.format?.trim() ?? "";

  const THERAPISTS_PER_PAGE = 20;
  const page = Number(params?.page ?? "1");
  const offset = (page - 1) * THERAPISTS_PER_PAGE;

  const { therapists: rawTherapists } = await getPublicTherapists(
    session?.userId,
    250,
    0,
    query,
    availability,
    payment,
    format
  );
  const therapists = rawTherapists.filter((therapist) => regionMatches(region, therapist.neighborhoods, therapist.city));
  const totalCount = therapists.length;
  const pagedTherapists = therapists.slice(offset, offset + THERAPISTS_PER_PAGE);

  const hasActiveFilters = query || region || availability || payment || format;

  const filterParams = new URLSearchParams({
    ...(query ? { q: query } : {}),
    ...(region ? { region } : {}),
    ...(availability ? { availability } : {}),
    ...(payment ? { payment } : {}),
    ...(format ? { format } : {}),
    ...(page > 1 ? { page: String(page) } : {}),
  });
  const baseQuery = filterParams.toString();

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl space-y-10 px-6 py-14">
        {/* Page header */}
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">Directory</p>
          <h1 className="font-serif text-[2.25rem] leading-tight text-foreground">Find a therapist for a referral</h1>
          <p className="text-sm text-muted-foreground">See openings, insurance, neighborhood, and who your colleagues know.</p>
        </div>

        <DirectoryFilters
          query={query}
          region={region}
          availability={availability}
          payment={payment}
          format={format}
        />

        <p className="text-xs text-muted-foreground/70">
          {pagedTherapists.length} therapist{pagedTherapists.length === 1 ? "" : "s"}
          {query ? ` for "${query}"` : ""}
        </p>
        {pagedTherapists.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {pagedTherapists.map((therapist) => {
              const currentUrl = `/directory${baseQuery ? `?${baseQuery}` : ""}#therapist-${therapist.slug}`;
              return (
                <div id={`therapist-${therapist.slug}`} key={therapist.slug}>
                  <TherapistCard
                    therapist={therapist}
                    currentProfileId={session?.userId}
                    returnTo={currentUrl}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No therapists match those filters"
            description="Try a broader search or remove a filter."
          />
        )}

        {/* Pagination */}
        {totalCount > THERAPISTS_PER_PAGE && (
          <div className="flex items-center justify-center gap-2">
            <Link
              className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-white/60 aria-disabled:pointer-events-none aria-disabled:opacity-40"
              aria-disabled={page === 1}
              tabIndex={page === 1 ? -1 : undefined}
              href={`/directory?q=${query}&region=${region}&availability=${availability}&payment=${payment}&format=${format}&page=${page - 1}`}
            >
              Previous
            </Link>
            <Link
              className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-white/60 aria-disabled:pointer-events-none aria-disabled:opacity-40"
              aria-disabled={page * THERAPISTS_PER_PAGE >= totalCount}
              tabIndex={page * THERAPISTS_PER_PAGE >= totalCount ? -1 : undefined}
              href={`/directory?q=${query}&region=${region}&availability=${availability}&payment=${payment}&format=${format}&page=${page + 1}`}
            >
              Next
            </Link>
          </div>
        )}
      </section>
    </PageShell>
  );
}
