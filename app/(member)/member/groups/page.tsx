import { GroupCard } from "@/components/domain/group-card";
import { EmptyState } from "@/components/state/empty-state";
import { requireMember } from "@/lib/auth/guards";
import { getMemberGroups } from "@/lib/data/live-data";

export default async function MemberGroupsPage() {
  const session = await requireMember();
  const groups = await getMemberGroups(session.userId);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {groups.length > 0 ? (
        groups.map((group) => <GroupCard group={group} key={group.id} memberView />)
      ) : (
        <EmptyState
          description="Groups you join or public groups will appear here."
          title="No groups yet"
        />
      )}
    </div>
  );
}
