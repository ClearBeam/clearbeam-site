// Netlify calls this function automatically whenever a form submission is
// created. It sends the customer a short auto-reply — but only when they
// left an email address (the field is optional on the quote form) and only
// once the RESEND_API_KEY environment variable is set in Netlify. Without
// the key it does nothing, so deploying it before the email service is
// set up is safe. Sending from khaled@clearbeamandautocare.com also needs
// the domain verified in Resend (DNS records), otherwise Resend rejects it.

const FROM = "ClearBeam and AutoCare <khaled@clearbeamandautocare.com>";
const REPLY_TO = "khaled@clearbeamandautocare.com";

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export default async (req: Request) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return new Response("email not configured", { status: 200 });

  let event: {
    payload?: { form_name?: string; email?: string; data?: Record<string, unknown> };
  };
  try {
    event = (await req.json()) as typeof event;
  } catch {
    return new Response("invalid payload", { status: 200 });
  }

  const payload = event.payload ?? {};
  // Only the quote form.
  if (payload.form_name && payload.form_name !== "quote-request") {
    return new Response("ignored", { status: 200 });
  }
  const email = text(payload.data?.email ?? payload.email, 200);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response("no email", { status: 200 });
  }
  const name = text(payload.data?.name, 120);
  const firstName = name.split(" ")[0] || "there";

  const subject = "Thanks for reaching out — ClearBeam and AutoCare";
  const bodyText =
    `Hi ${firstName},\n\n` +
    `Thanks for reaching out to ClearBeam and AutoCare — we've received your request and we'll be in touch soon, usually within the hour during business hours (7:30 AM – 6:00 PM, every day).\n\n` +
    `If your car can't wait, call or text us at (346) 297-0076.\n\n` +
    `Thanks,\nKhaled\nClearBeam and AutoCare\nclearbeamandautocare.com`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      reply_to: REPLY_TO,
      subject,
      text: bodyText,
    }),
  });

  if (!res.ok) {
    console.error("auto-reply failed", res.status, await res.text().catch(() => ""));
    return new Response("send failed", { status: 200 });
  }
  return new Response("sent", { status: 200 });
};
