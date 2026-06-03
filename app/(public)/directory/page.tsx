import { PageShell } from "@/components/layout/page-shell";
import Link from "next/link";
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

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl space-y-8 px-6 py-16">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Directory</p>
          <h1 className="font-serif text-5xl leading-tight text-foreground">Find a therapist for a referral</h1>
          <p className="text-base text-muted-foreground">See openings, insurance, neighborhood, and who your colleagues know.</p>
        </div>
        <form className="space-y-4">
          {/* Filter inputs grid */}
          <div className="grid gap-4 rounded-[28px] border bg-white/90 p-5 md:grid-cols-[1.6fr_repeat(4,1fr)]">
            <input
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
              defaultValue={query}
              name="q"
              placeholder="Search by name, specialty, neighborhood, or referral need"
            />
            <select className="w-full rounded-2xl border bg-background px-4 py-3 text-sm" defaultValue={region} name="region">
              <option value="">All Austin metro areas</option>
              {AUSTIN_METRO_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <select className="w-full rounded-2xl border bg-background px-4 py-3 text-sm" defaultValue={availability} name="availability">
              <option value="">Any availability</option>
              <option value="accepting">Accepting new clients</option>
              <option value="waitlist">Limited openings</option>
              <option value="full">Not accepting referrals</option>
            </select>
            <select className="w-full rounded-2xl border bg-background px-4 py-3 text-sm" defaultValue={payment} name="payment">
              <option value="">Any payment model</option>
              <option value="private_pay">Private pay</option>
              <option value="insurance">Insurance</option>
              <option value="both">Private pay + insurance</option>
            </select>
            <select className="w-full rounded-2xl border bg-background px-4 py-3 text-sm" defaultValue={format} name="format">
              <option value="">Any care format</option>
              <option value="telehealth">Telehealth</option>
              <option value="in_person">In person</option>
              <option value="both">Both</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-xl border border-foreground bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-foreground/90"
            >
              Apply filters
            </button>
            <Link
              href="/directory"
              className="rounded-xl border border-foreground px-6 py-3 text-sm font-medium text-foreground hover:bg-background/50"
            >
              Clear filters
            </Link>
          </div>

          {/* Active filters summary */}
          {(query || region || availability || payment || format) && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Active filters</p>
              <div className="flex flex-wrap gap-2">
                {query && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-muted-foreground bg-background px-3 py-1 text-sm">
                    Search: <span className="font-medium">{query}</span>
                  </span>
                )}
                {region && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-muted-foreground bg-background px-3 py-1 text-sm">
                    Region: <span className="font-medium">{region}</span>
                  </span>
                )}
                {availability && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-muted-foreground bg-background px-3 py-1 text-sm">
                    Availability:{" "}
                    <span className="font-medium">
                      {availability === "accepting"
                        ? "Accepting new"
                        : availability === "waitlist"
                          ? "Limited openings"
                          : "Not accepting"}
                    </span>
                  </span>
                )}
                {payment && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-muted-foreground bg-background px-3 py-1 text-sm">
                    Payment:{" "}
                    <span className="font-medium">
                      {payment === "private_pay"
                        ? "Private pay"
                        : payment === "insurance"
                          ? "Insurance"
                          : "Both"}
                    </span>
                  </span>
                )}
                {format && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-muted-foreground bg-background px-3 py-1 text-sm">
                    Format:{" "}
                    <span className="font-medium">
                      {format === "telehealth"
                        ? "Telehealth"
                        : format === "in_person"
                          ? "In person"
                          : "Both"}
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}
        </form>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Showing {pagedTherapists.length} therapist{pagedTherapists.length === 1 ? "" : "s"}
            {query ? ` for "${query}"` : ""}.
          </p>
          <p>Each card shows openings, payment, and colleague referrals.</p>
        </div>
        {pagedTherapists.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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

        {totalCount > THERAPISTS_PER_PAGE && (
          <div className="flex items-center justify-center gap-2">
            <Link
              className="rounded-xl border px-4 py-2 text-sm font-medium"
              aria-disabled={page === 1}
              tabIndex={page === 1 ? -1 : undefined}
              href={`/directory?q=${query}&region=${region}&availability=${availability}&payment=${payment}&format=${format}&page=${page - 1}`}
            >
              Previous
            </Link>
            <Link
              className="rounded-xl border px-4 py-2 text-sm font-medium"
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
