"use client";

import { IncomingReferrals } from "@/components/domain/incoming-referrals";
import { ReferralComposeForm } from "@/components/domain/referral-compose-form";
import { ReferralTracker } from "@/components/domain/referral-tracker";
import { EmptyState } from "@/components/state/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ClientCase, IncomingReferral } from "@/lib/data/referral-tracking";
import type { PublicTherapistSummary } from "@/types";

type Tab = "incoming" | "search" | "sent";

export function ReferralsTabs({
  defaultTab,
  openIncomingCount,
  therapists,
  incomingReferrals,
  referralCases,
  statusCopy,
  sentThisMonth,
  awaitingCount,
  senderName,
  senderEmail,
}: {
  defaultTab: Tab;
  openIncomingCount: number;
  therapists: PublicTherapistSummary[];
  incomingReferrals: IncomingReferral[];
  referralCases: ClientCase[];
  statusCopy: string | null;
  sentThisMonth: number;
  awaitingCount: number;
  senderName: string;
  senderEmail: string;
}) {
  function handleTabChange(value: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", value);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }

  return (
    <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="space-y-0">
      <TabsList className="flex w-full justify-center gap-8 border-b border-border bg-transparent px-0 pb-0">
        <TabsTrigger
          value="search"
          className="rounded-none border-b-2 border-transparent pb-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
        >
          Search
        </TabsTrigger>
        <TabsTrigger
          value="incoming"
          className="rounded-none border-b-2 border-transparent pb-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
        >
          Incoming
          {openIncomingCount > 0 && (
            <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
              {openIncomingCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="sent"
          className="rounded-none border-b-2 border-transparent pb-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
        >
          Sent
        </TabsTrigger>
      </TabsList>

      <TabsContent value="incoming" className="mt-6">
        {incomingReferrals.length > 0 ? (
          <IncomingReferrals referrals={incomingReferrals} />
        ) : (
          <EmptyState
            title="No incoming referrals yet"
            description="Referrals sent to you by colleagues will appear here."
          />
        )}
      </TabsContent>

      <TabsContent value="search" className="mt-6">
        <ReferralComposeForm
          statusCopy={statusCopy}
          therapists={therapists}
          senderName={senderName}
          senderEmail={senderEmail}
        />
      </TabsContent>

      <TabsContent value="sent" className="mt-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          {referralCases.length} sent total · {sentThisMonth} this month
          {awaitingCount > 0 && <> · {awaitingCount} awaiting response</>}
        </p>
        {referralCases.length > 0 ? (
          <ReferralTracker cases={referralCases} />
        ) : (
          <EmptyState
            title="No referrals sent yet"
            description="Your sent referrals will appear here with clear status updates."
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
