import "server-only";

/**
 * Sends one email through Resend's HTTP API (set RESEND_API_KEY, and EMAIL_FROM once you have verified a domain).
 * Without a key, development just prints the message to the server console so signup still works locally;
 * production without a key reports failure instead of pretending the email went out.
 */
export async function sendEmail(msg: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[mailer] RESEND_API_KEY not set. Would send to ${msg.to}: ${msg.subject}\n${msg.text}`);
      return true;
    }
    console.error("[mailer] RESEND_API_KEY is not set; cannot send email");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || "DL Typing <onboarding@resend.dev>", to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
    });
    if (!res.ok) {
      console.error("[mailer] Resend rejected the email", res.status, await res.text().catch(() => ""));
      devFallback(msg);
    }
    return res.ok;
  } catch (error) {
    console.error("[mailer] could not reach Resend", error);
    devFallback(msg);
    return false;
  }
}

/** While developing, a failed send must not block testing: print the message (and its link) to the terminal. */
function devFallback(msg: { to: string; subject: string; text: string }) {
  if (process.env.NODE_ENV !== "production") console.info(`[mailer] (dev) Email to ${msg.to} was not delivered. Here is what it said:\n${msg.subject}\n${msg.text}`);
}
