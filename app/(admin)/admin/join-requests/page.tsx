import { reviewJoinRequest } from "@/app-actions/admin-actions";
import { EmptyState } from "@/components/state/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAdminJoinRequests } from "@/lib/data/live-data";
import type { JoinRequestSummary } from "@/types";

const PAYMENT_LABELS: Record<string, string> = {
  private_pay: "Private pay only",
  insurance: "Insurance only",
  both: "Private pay + insurance",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  accepting: "Accepting new clients",
  waitlist: "Waitlist",
  full: "Not accepting referrals",
};

const CARE_FORMAT_LABELS: Record<string, string> = {
  in_person: "In person",
  telehealth: "Telehealth",
  both: "In person & telehealth",
};

function getStatusCopy(error?: string, reviewed?: string) {
  if (reviewed === "active") return "Join request approved.";
  if (reviewed === "rejected") return "Join request rejected.";
  if (error === "invalid-review") return "Please choose a valid review action.";
  if (error === "missing-request") return "That join request could not be found.";
  if (error === "review-failed") return "We couldn't save that review decision. Please try again.";
  return null;
}

function JoinRequestCard({
  request,
  footer,
}: {
  request: JoinRequestSummary;
  footer: React.ReactNode;
}) {
  return (
    <Card className="bg-white/90">
      <CardHeader className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {request.createdAtLabel} · {request.status}
        </p>
        <CardTitle className="text-xl">{request.fullName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">

        {/* Contact */}
        <div className="space-y-0.5">
          <p>{request.email}</p>
          {request.credentials && <p>{request.credentials}</p>}
          {request.website && (
            <p>
              <a href={request.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {request.website}
              </a>
            </p>
          )}
        </div>

        {/* Onboarding fields */}
        {request.levelOfCare.length > 0 && (
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Level of care</span>
            <p>{request.levelOfCare.join(", ")}</p>
          </div>
        )}

        {request.specialties.length > 0 && (
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Specialties</span>
            <p>{request.specialties.join(", ")}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {request.paymentModel && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment</span>
              <p>{PAYMENT_LABELS[request.paymentModel] ?? request.paymentModel}</p>
            </div>
          )}
          {request.onboardingAvailability && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Availability</span>
              <p>{AVAILABILITY_LABELS[request.onboardingAvailability] ?? request.onboardingAvailability}</p>
            </div>
          )}
          {request.careFormat && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Format</span>
              <p>{CARE_FORMAT_LABELS[request.careFormat] ?? request.careFormat}</p>
            </div>
          )}
        </div>

        {/* Sponsor / referral */}
        {request.sponsorName && (
          <p>Referred by {request.sponsorName}</p>
        )}
        {request.referralCode && (
          <p className="text-xs text-muted-foreground">Referral code: {request.referralCode}</p>
        )}

        {footer}
      </CardContent>
    </Card>
  );
}

function PendingReviewForm({ request }: { request: JoinRequestSummary }) {
  return (
    <form action={reviewJoinRequest} className="space-y-3 border-t pt-4">
      <input name="requestId" type="hidden" value={request.id} />
      <label className="flex items-center gap-2">
        <input name="grantReferrals" type="checkbox" />
        Grant trusted-referrer access on approval
      </label>
      <textarea
        className="min-h-24 w-full rounded-2xl border bg-background px-4 py-3 text-sm"
        name="rejectionReason"
        placeholder="Optional rejection note"
      />
      <div className="flex flex-wrap gap-3">
        <Button name="decision" type="submit" value="approve">
          Approve
        </Button>
        <Button name="decision" type="submit" value="reject" variant="outline">
          Reject
        </Button>
      </div>
    </form>
  );
}

function ReviewedFooter({ request }: { request: JoinRequestSummary }) {
  return (
    <div className="space-y-1 border-t pt-4 text-sm">
      <p>
        {request.status === "active" ? "Approved" : "Rejected"}
        {request.reviewedAtLabel ? ` ${request.reviewedAtLabel}` : ""}
      </p>
      {request.status === "rejected" && request.rejectionReason && (
        <p className="text-xs text-muted-foreground">Reason: {request.rejectionReason}</p>
      )}
    </div>
  );
}

function RequestGrid({
  requests,
  emptyTitle,
  emptyDescription,
  renderFooter,
}: {
  requests: JoinRequestSummary[];
  emptyTitle: string;
  emptyDescription: string;
  renderFooter: (request: JoinRequestSummary) => React.ReactNode;
}) {
  if (requests.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {requests.map((request) => (
        <JoinRequestCard key={request.id} request={request} footer={renderFooter(request)} />
      ))}
    </div>
  );
}

export default async function AdminJoinRequestsPage({
  searchParams
}: {
  searchParams?: Promise<{ reviewed?: string; error?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const requests = await getAdminJoinRequests();
  const statusCopy = getStatusCopy(params?.error, params?.reviewed);

  const pending = requests.filter((r) => r.status === "pending");
  const accepted = requests.filter((r) => r.status === "active");
  const rejected = requests.filter((r) => r.status === "rejected");

  return (
    <div className="space-y-6">
      {statusCopy ? (
        <div className="rounded-[28px] border bg-white/90 p-6 text-sm leading-7 text-muted-foreground shadow-soft">
          {statusCopy}
        </div>
      ) : null}

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({accepted.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <RequestGrid
            requests={pending}
            emptyTitle="No join requests pending"
            emptyDescription="New therapist applications will appear here for manual review."
            renderFooter={(request) => <PendingReviewForm request={request} />}
          />
        </TabsContent>

        <TabsContent value="accepted">
          <RequestGrid
            requests={accepted}
            emptyTitle="No accepted join requests"
            emptyDescription="Approved applications will appear here."
            renderFooter={(request) => <ReviewedFooter request={request} />}
          />
        </TabsContent>

        <TabsContent value="rejected">
          <RequestGrid
            requests={rejected}
            emptyTitle="No rejected join requests"
            emptyDescription="Declined applications will appear here."
            renderFooter={(request) => <ReviewedFooter request={request} />}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
