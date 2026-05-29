import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-5xl space-y-10 px-6 py-16">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">About</p>
          <h1 className="font-serif text-5xl leading-tight text-foreground">Austin Therapist Exchange</h1>
          <p className="text-base text-muted-foreground">A trusted referral network for Austin therapists.</p>
        </div>

        <div className="space-y-6">
          <Card className="bg-white/90">
            <CardHeader>
              <CardTitle>Who it's for</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>Austin Therapist Exchange is for licensed mental health clinicians practicing in the Austin metro area who want to give and receive referrals within a trusted professional network.</p>
              <p>Whether you specialize in a specific modality, client population, or insurance model, this is where local therapists find the right match quickly.</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90">
            <CardHeader>
              <CardTitle>What members can do</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <ul className="list-inside space-y-2">
                <li><strong>Browse the directory:</strong> Search by specialty, neighborhood, insurance, and availability.</li>
                <li><strong>See colleague trust signals:</strong> Know who your peers trust before you reach out.</li>
                <li><strong>Send referrals:</strong> Connect clients with the right fit, directly from the platform.</li>
                <li><strong>Build your network:</strong> Follow colleagues and stay connected with your professional community.</li>
                <li><strong>Manage your profile:</strong> Keep your availability, specialties, and credentials current.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/90">
            <CardHeader>
              <CardTitle>Why access is referral-based</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>We keep membership limited and sponsor-backed to maintain quality and trust. Each new member is vouched for by an existing member, which keeps the network professional and reliable.</p>
              <p>This model helps us ensure members are licensed practitioners and committed to meaningful referral relationships.</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90">
            <CardHeader>
              <CardTitle>How to join</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p><strong>Step 1:</strong> An existing member shares a referral code with you.</p>
              <p><strong>Step 2:</strong> Use that code to submit an application with your basic info.</p>
              <p><strong>Step 3:</strong> Our team reviews applications quickly.</p>
              <p><strong>Step 4:</strong> After approval, sign in and finish setting up your profile.</p>
              <p className="text-xs italic">If you don't know anyone on the platform yet, reach out to a practice you'd like to connect with—they can sponsor you or point you to an existing member.</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90">
            <CardHeader>
              <CardTitle>What happens after approval</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>Once approved, you'll have full member access. Complete your profile with your specialties, availability, insurance, and practice details. Then you can search the directory, send referrals, and connect with colleagues.</p>
              <p>Your profile helps other therapists understand who you are and what you offer, so they know when to reach out.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
