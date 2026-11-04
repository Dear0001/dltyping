import "server-only";
import nodemailer from "nodemailer";

type Message = { to: string; subject: string; html: string; text: string };

/**
 * Sends one email. Tries Gmail first (set GMAIL_USER and GMAIL_APP_PASSWORD; needs a Google App Password),
 * then falls back to Resend (RESEND_API_KEY, and EMAIL_FROM once you have verified a domain).
 * With neither configured, development just prints the message to the server console so signup still works locally;
 * production reports failure instead of pretending the email went out.
 */
export async function sendEmail(msg: Message): Promise<boolean> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const resendKey = process.env.RESEND_API_KEY;

  if (!(gmailUser && gmailPass) && !resendKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[mailer] No email provider configured. Would send to ${msg.to}: ${msg.subject}\n${msg.text}`);
      return true;
    }
    console.error("[mailer] No email provider configured (GMAIL_USER/GMAIL_APP_PASSWORD or RESEND_API_KEY); cannot send email");
    return false;
  }

  if (gmailUser && gmailPass && (await sendViaGmail(gmailUser, gmailPass, msg))) return true;
  if (resendKey && (await sendViaResend(resendKey, msg))) return true;
  devFallback(msg);
  return false;
}

async function sendViaGmail(user: string, pass: string, msg: Message): Promise<boolean> {
  try {
    // App passwords are shown with spaces ("abcd efgh ijkl mnop"); Gmail wants them without.
    const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass: pass.replace(/\s+/g, "") } });
    await transport.sendMail({ from: process.env.GMAIL_FROM || `DL Typing <${user}>`, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text });
    return true;
  } catch (error) {
    console.error("[mailer] Gmail could not send the email", error);
    return false;
  }
}

async function sendViaResend(key: string, msg: Message): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || "DL Typing <onboarding@resend.dev>", to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
    });
    if (!res.ok) console.error("[mailer] Resend rejected the email", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (error) {
    console.error("[mailer] could not reach Resend", error);
    return false;
  }
}

/** While developing, a failed send must not block testing: print the message (and its link) to the terminal. */
function devFallback(msg: Pick<Message, "to" | "subject" | "text">) {
  if (process.env.NODE_ENV !== "production") console.info(`[mailer] (dev) Email to ${msg.to} was not delivered. Here is what it said:\n${msg.subject}\n${msg.text}`);
}
