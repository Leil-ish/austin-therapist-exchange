import { updatePassword } from "@/app-actions/auth-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

const INPUT = "w-full rounded-2xl border bg-background px-4 py-3 text-sm";

function getErrorCopy(error?: string) {
  if (error === "missing-password") {
    return "Please enter and confirm your new password.";
  }

  if (error === "password-mismatch") {
    return "The password fields did not match.";
  }

  if (error === "password-too-short") {
    return "Use at least 10 characters for your password.";
  }

  return error ? `Password update error: ${error}` : null;
}

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ passwordError?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const errorCopy = getErrorCopy(params?.passwordError);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Change your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Update your password anytime.</p>
      </div>

      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>New password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
          {errorCopy ? (
            <div className="rounded-[24px] border bg-background p-4">{errorCopy}</div>
          ) : null}
          <form action={updatePassword} className="space-y-4">
            <input className={INPUT} name="password" placeholder="New password" type="password" />
            <input className={INPUT} name="confirmPassword" placeholder="Confirm new password" type="password" />
            <SubmitButton pendingLabel="Saving…" variant="outline">Save password</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
