import { Resend } from "resend";

const FROM = "Austin Therapist Exchange <noreply@mail.austintherapistexchange.com>";
const ADMIN_EMAIL = "hello@austintherapistexchange.com";

function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export async function notifyAdminOfNewApplication(applicant: {
  fullName: string;
  email: string;
  credentials: string;
  note?: string;
}) {
  try {
    const resend = getClient();
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New application: ${applicant.fullName}`,
      text: [
        `A new member application has been submitted.`,
        ``,
        `Name: ${applicant.fullName}`,
        `Email: ${applicant.email}`,
        `Credentials: ${applicant.credentials}`,
        applicant.note ? `Note: ${applicant.note}` : "",
        ``,
        `Review at https://austintherapistexchange.com/admin/join-requests`
      ].filter((l) => l !== undefined).join("\n")
    });
  } catch {
    // Best-effort — don't block the application submission if email fails
  }
}

export async function notifyApplicantOfDecision(applicant: {
  email: string;
  fullName: string;
  decision: "approve" | "reject";
  rejectionReason?: string;
}) {
  try {
    const resend = getClient();

    const firstName = applicant.fullName.split(" ")[0] ?? applicant.fullName;

    if (applicant.decision === "approve") {
      await resend.emails.send({
        from: FROM,
        to: applicant.email,
        subject: "You're approved — welcome to Austin Therapist Exchange",
        text: [
          `Hi ${firstName},`,
          ``,
          `Your application to Austin Therapist Exchange has been approved.`,
          ``,
          `You can now log in and complete your profile:`,
          `https://austintherapistexchange.com/login`,
          ``,
          `Welcome to the network.`,
          ``,
          `— The Austin Therapist Exchange team`
        ].join("\n")
      });
    } else {
      await resend.emails.send({
        from: FROM,
        to: applicant.email,
        subject: "Your Austin Therapist Exchange application",
        text: [
          `Hi ${firstName},`,
          ``,
          `Thank you for applying to Austin Therapist Exchange.`,
          ``,
          `After review, we're not able to approve your application at this time.`,
          applicant.rejectionReason ? `\n${applicant.rejectionReason}` : "",
          ``,
          `If you have questions, you can reach us at ${ADMIN_EMAIL}.`,
          ``,
          `— The Austin Therapist Exchange team`
        ].filter((l) => l !== undefined).join("\n")
      });
    }
  } catch {
    // Best-effort — don't block the review action if email fails
  }
}
