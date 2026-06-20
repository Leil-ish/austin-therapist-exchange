import { PageShell } from "@/components/layout/page-shell";
import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/state/empty-state";
import { TherapistCard } from "@/components/domain/therapist-card";
import { requireMember } from "@/lib/auth/guards";
import { getPublicTherapists } from "@/lib/data/live-data";
import { AUSTIN_METRO_AREAS, regionMatches } from "@/lib/referral-matching";

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

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl space-y-10 px-6 py-14">
        {/* Page header */}
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">Directory</p>
          <h1 className="font-serif text-[2.25rem] leading-tight text-foreground">Find a therapist for a referral</h1>
          <p className="text-sm text-muted-foreground">See openings, insurance, neighborhood, and who your colleagues know.</p>
        </div>

        {/* Filter form */}
        <form className="space-y-3">
          {/* Search row */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              className="w-full rounded-xl bg-white/90 py-3 pl-10 pr-4 text-sm shadow-paper placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              defaultValue={query}
              name="q"
              placeholder="Search by name, specialty, neighborhood, or referral need"
            />
          </div>

          {/* Filter + submit row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-1 flex-wrap gap-2">
              <select
                className="min-w-[9rem] flex-1 rounded-lg border border-border/40 bg-white/80 px-3 py-2.5 text-xs text-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary/30"
                defaultValue={region}
                name="region"
              >
                <option value="">All areas</option>
                {AUSTIN_METRO_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <select
                className="min-w-[8rem] flex-1 rounded-lg border border-border/40 bg-white/80 px-3 py-2.5 text-xs text-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary/30"
                defaultValue={availability}
                name="availability"
              >
                <option value="">Any availability</option>
                <option value="accepting">Accepting</option>
                <option value="waitlist">Limited</option>
                <option value="full">Not accepting</option>
              </select>
              <select
                className="min-w-[8rem] flex-1 rounded-lg border border-border/40 bg-white/80 px-3 py-2.5 text-xs text-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary/30"
                defaultValue={payment}
                name="payment"
              >
                <option value="">Any payment</option>
                <option value="private_pay">Private pay</option>
                <option value="insurance">Insurance</option>
                <option value="both">Both</option>
              </select>
              <select
                className="min-w-[8rem] flex-1 rounded-lg border border-border/40 bg-white/80 px-3 py-2.5 text-xs text-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary/30"
                defaultValue={format}
                name="format"
              >
                <option value="">Any format</option>
                <option value="telehealth">Telehealth</option>
                <option value="in_person">In person</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
              >
                Apply
              </button>
              {hasActiveFilters && (
                <Link
                  href="/directory"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear
                </Link>
              )}
            </div>
          </div>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {query && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border/40 bg-white/60 px-2.5 py-1 text-xs text-muted-foreground">
                  Search: <span className="font-medium text-foreground/80">{query}</span>
                </span>
              )}
              {region && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border/40 bg-white/60 px-2.5 py-1 text-xs text-muted-foreground">
                  Area: <span className="font-medium text-foreground/80">{region}</span>
                </span>
              )}
              {availability && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border/40 bg-white/60 px-2.5 py-1 text-xs text-muted-foreground">
                  {availability === "accepting" ? "Accepting" : availability === "waitlist" ? "Limited" : "Not accepting"}
                </span>
              )}
              {payment && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border/40 bg-white/60 px-2.5 py-1 text-xs text-muted-foreground">
                  {payment === "private_pay" ? "Private pay" : payment === "insurance" ? "Insurance" : "Private pay + insurance"}
                </span>
              )}
              {format && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border/40 bg-white/60 px-2.5 py-1 text-xs text-muted-foreground">
                  {format === "telehealth" ? "Telehealth" : format === "in_person" ? "In person" : "In person + telehealth"}
                </span>
              )}
            </div>
          )}
        </form>

        {/* Result count */}
        <p className="text-xs text-muted-foreground/70">
          {pagedTherapists.length} therapist{pagedTherapists.length === 1 ? "" : "s"}
          {query ? ` for "${query}"` : ""}
        </p>

        {/* Card grid */}
        {pagedTherapists.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {pagedTherapists.map((therapist) => (
              <TherapistCard key={therapist.slug} therapist={therapist} currentProfileId={session?.userId} />
            ))}
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
