import { GroupCard } from "@/components/domain/group-card";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { EmptyState } from "@/components/state/empty-state";
import { getPublicGroups } from "@/lib/data/live-data";

export default async function PublicGroupsPage() {
  const groups = await getPublicGroups();

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl space-y-8 px-6 py-16">
        <SectionHeading
          description="Public groups are discoverable without login, while any private therapist collaboration remains in the member area."
          eyebrow="Groups"
          title="Public-facing groups for Austin Therapist Exchange"
        />
        <div className="grid gap-6 md:grid-cols-2">
          {groups.length > 0 ? (
            groups.map((group) => <GroupCard group={group} key={group.slug} />)
          ) : (
            <EmptyState description="Public groups will appear here once created." title="No public groups yet" />
          )}
        </div>
      </section>
    </PageShell>
  );
}
