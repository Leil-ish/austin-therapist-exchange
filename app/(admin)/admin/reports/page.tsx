import { AdminListCard } from "@/components/domain/admin-list-card";
import { EmptyState } from "@/components/state/empty-state";
import { getAdminModerationReports } from "@/lib/data/live-data";

export default async function AdminReportsPage() {
  const reports = await getAdminModerationReports();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {reports.length > 0 ? (
        reports.map((report) => (
          <AdminListCard
            body={`Reported by ${report.reporterName}. Reason: ${report.reason}.`}
            key={report.id}
            meta={`${report.createdAtLabel} · ${report.targetType} · ${report.status}`}
            title="Moderation report"
          />
        ))
      ) : (
        <EmptyState description="No reports have been submitted yet." title="No reports" />
      )}
    </div>
  );
}
