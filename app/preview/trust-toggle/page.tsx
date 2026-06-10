import { TrustToggleButton } from "@/components/domain/trust-toggle-button";

export default function TrustTogglePreviewPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-10">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
        <h1 className="font-serif text-3xl text-foreground">Trust toggle button</h1>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Not followed</p>
          <TrustToggleButton followedProfileId="preview-a" initialIsFollowed={false} />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Already in network (hover to see Remove)</p>
          <TrustToggleButton followedProfileId="preview-b" initialIsFollowed={true} />
        </div>
      </div>
    </main>
  );
}
