import { PageShell } from "@/components/layout/page-shell";
import Link from "next/link";
import { EmptyState } from "@/components/state/empty-state";
import { DirectoryFilters } from "@/components/domain/directory-filters";
import { TherapistCard } from "@/components/domain/therapist-card";
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
  const params = searchParams ? await searchParams : undefined;
  const session = await getSession();

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
        <DirectoryFilters
          query={query}
          region={region}
          availability={availability}
          payment={payment}
          format={format}
        />
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
