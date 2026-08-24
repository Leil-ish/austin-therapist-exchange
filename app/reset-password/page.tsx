import Link from "next/link";

import { completePasswordRecovery } from "@/app-actions/auth-actions";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getErrorCopy(error?: string) {
  if (error === "missing-password") {
    return "Please enter and confirm your new password.";
  }

  if (error === "password-mismatch") {
    return "Those passwords did not match.";
  }

  if (error === "password-too-short") {
    return "Use at least 10 characters.";
  }

  return error ? `Password reset error: ${error}` : null;
}

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; then?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const errorCopy = getErrorCopy(params?.error);
  const then = params?.then ?? "";

  return (
    <PageShell>
      <section className="mx-auto max-w-2xl space-y-8 px-6 py-16">
        <SectionHeading
          eyebrow="Password reset"
          title="Choose a new password"
          description="Once this is saved, use it for future sign-ins."
        />

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>New password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            {errorCopy ? (
              <div className="rounded-[24px] border bg-background p-4">
                {errorCopy}
              </div>
            ) : null}
            <form action={completePasswordRecovery} className="space-y-4">
              <input type="hidden" name="then" value={then} />
              <input
                className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
                name="password"
                placeholder="New password"
                type="password"
              />
              <input
                className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
                name="confirmPassword"
                placeholder="Confirm new password"
                type="password"
              />
              <Button type="submit">Save new password</Button>
            </form>
            <Button asChild variant="ghost">
              <Link href="/login">Back to sign-in</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
