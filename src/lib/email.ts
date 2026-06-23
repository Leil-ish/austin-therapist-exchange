import "server-only";

const FROM_ADDRESS = "Austin Therapist Exchange <noreply@mail.austintherapistexchange.com>";
const ADMIN_EMAIL = "chasementalwellness@gmail.com";

async function send({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("[email] RESEND_API_KEY not set — skipping send:", { to, subject });
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });

  if (error) {
    console.error("[email] send failed:", error);
  }
}

export async function sendAdminNotificationEmail(applicant: {
  fullName: string;
  email: string;
  credentials?: string;
  website?: string;
  levelOfCare: string[];
  specialties: string[];
  paymentModel?: string;
  availability?: string;
  careFormat?: string;
  sponsorName?: string;
}) {
  const rows = [
    `<tr><th align="left">Name</th><td>${applicant.fullName}</td></tr>`,
    `<tr><th align="left">Email</th><td>${applicant.email}</td></tr>`,
    applicant.credentials ? `<tr><th align="left">Credentials</th><td>${applicant.credentials}</td></tr>` : "",
    applicant.website ? `<tr><th align="left">Website</th><td>${applicant.website}</td></tr>` : "",
    `<tr><th align="left">Level of care</th><td>${applicant.levelOfCare.join(", ") || "—"}</td></tr>`,
    `<tr><th align="left">Specialties</th><td>${applicant.specialties.join(", ") || "—"}</td></tr>`,
    applicant.paymentModel ? `<tr><th align="left">Payment model</th><td>${applicant.paymentModel}</td></tr>` : "",
    applicant.availability ? `<tr><th align="left">Availability</th><td>${applicant.availability}</td></tr>` : "",
    applicant.careFormat ? `<tr><th align="left">Care format</th><td>${applicant.careFormat}</td></tr>` : "",
    applicant.sponsorName ? `<tr><th align="left">Referred by</th><td>${applicant.sponsorName}</td></tr>` : "",
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family: sans-serif; max-width: 640px;">
      <h2 style="font-size: 20px; margin-bottom: 16px;">New application: ${applicant.fullName}</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top: 24px;">
        <a href="https://austintherapistexchange.com/admin/join-requests"
           style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
          Review applications →
        </a>
      </p>
    </div>
  `;

  await send({ to: ADMIN_EMAIL, subject: `New application: ${applicant.fullName}`, html });
}

export async function sendApprovalEmail(to: string, name: string, setPasswordLink: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 640px;">
      <h1 style="font-size: 24px;">Welcome to Austin Therapist Exchange, ${name}</h1>
      <p>Your application has been approved. Click the button below to set your password and access your account.</p>
      <p style="margin: 24px 0;">
        <a href="${setPasswordLink}"
           style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
          Set your password →
        </a>
      </p>
      <p>After signing in, add your bio, the neighborhoods you serve, and your insurance carriers — these help colleagues find you in referral searches.</p>
      <p style="color:#6b7280;font-size:13px;margin-top:32px;">
        If you didn't apply for Austin Therapist Exchange, you can ignore this email.
      </p>
    </div>
  `;

  await send({ to, subject: "Welcome to Austin Therapist Exchange — set your password", html });
}

export async function sendDenialEmail(to: string, reason?: string) {
  const reasonBlock = reason
    ? `<p style="margin-top:12px;">${reason}</p>`
    : "";

  const html = `
    <div style="font-family: sans-serif; max-width: 640px;">
      <p>Thank you for your interest in Austin Therapist Exchange. After review, we aren't able to offer membership at this time. You're welcome to reapply in the future.</p>
      ${reasonBlock}
    </div>
  `;

  await send({ to, subject: "Austin Therapist Exchange — Application update", html });
}
