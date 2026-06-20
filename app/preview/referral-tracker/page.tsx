import { ReferralTracker } from "@/components/domain/referral-tracker";
import { MOCK_REFERRAL_CASES } from "@/lib/data/referral-tracking";

export default function ReferralTrackerPreviewPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
        <h1 className="font-serif text-3xl text-foreground">Referral tracking</h1>
      </div>
      <ReferralTracker cases={MOCK_REFERRAL_CASES} />
    </main>
  );
}
