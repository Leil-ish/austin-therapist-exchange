import { confirmRecoveryToken } from "@/app-actions/auth-actions";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function AuthConfirmPage({
  searchParams
}: {
  searchParams?: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const tokenHash = params?.token_hash ?? "";
  const type = params?.type ?? "";
  const next = params?.next ?? "";
  const isValidLink = Boolean(tokenHash && type);

  return (
    <PageShell>
      <section className="mx-auto max-w-2xl space-y-8 px-6 py-16">
        <SectionHeading
          eyebrow="Set your password"
          title="Set your password"
          description="Click continue to verify this link and set a password for your account."
        />

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Continue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            {isValidLink ? (
              <form action={confirmRecoveryToken} className="space-y-4">
                <input type="hidden" name="token_hash" value={tokenHash} />
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="next" value={next} />
                <SubmitButton pendingLabel="Verifying…">Continue</SubmitButton>
              </form>
            ) : (
              <div className="rounded-[24px] border bg-background p-4">
                This link is missing information and can&apos;t be used. Request a new one from
                the sign-in page.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
