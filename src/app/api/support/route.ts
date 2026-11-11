import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { clientIp, getSessionUser, isSameOrigin, throttle } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";
import { ATTACHMENT, CONTACT, TEXT_FIELDS, referenceFor, safeFileName, sniffFileType, validateSupport, type FieldErrors, type SupportFields } from "@/lib/support";

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const fail = (status: number, body: { error?: string; errors?: FieldErrors }) => Response.json(body, { status });

/**
 * Saves a Contact / Feedback / Report submission (multipart form data) and emails a copy to the site owner after responding.
 * Answers `{ ok, reference }` only once the row is stored; validation problems come back as `{ errors: { field: code } }`.
 */
export async function POST(request: Request) {
  if (!(await isSameOrigin(request))) return fail(403, { error: "invalid" });
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) return fail(415, { error: "invalid" });
  // Reject oversized bodies before reading them (file limit plus room for the text fields).
  if (Number(request.headers.get("content-length") ?? 0) > ATTACHMENT.maxBytes + 100_000) return fail(413, { errors: { attachment: "fileSize" } });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, { error: "invalid" });
  }

  const kind = form.get("kind");
  const fields: SupportFields = {};
  for (const key of TEXT_FIELDS) {
    const v = form.get(key);
    if (typeof v === "string") fields[key] = v;
  }
  const parsed = validateSupport(kind, fields);
  const errors: FieldErrors = "errors" in parsed ? { ...parsed.errors } : {};

  // Attachment (Report a Problem only): check size and the actual bytes, never the client's claimed type.
  let file: { name: string; type: string; bytes: Buffer } | null = null;
  const upload = form.get("attachment");
  if (kind === "report" && upload instanceof File && upload.size > 0) {
    if (upload.size > ATTACHMENT.maxBytes) errors.attachment = "fileSize";
    else {
      const bytes = Buffer.from(await upload.arrayBuffer());
      const type = sniffFileType(bytes);
      if (!type) errors.attachment = "fileType";
      else file = { name: safeFileName(upload.name), type, bytes };
    }
  }
  if ("errors" in parsed || Object.keys(errors).length) return fail(400, { errors });
  const v = parsed.value;

  if (!(await throttle(`support:${await clientIp()}`, 5))) return fail(429, { error: "rate" });

  const user = await getSessionUser().catch(() => null);
  const id = randomUUID();
  const reference = referenceFor(id);
  try {
    await prisma.support_messages.create({
      data: {
        id, reference, kind: v.kind, name: v.name, email: v.email, category: v.category, subject: v.subject, message: v.message,
        rating: v.rating, steps: v.steps, expected: v.expected, actual: v.actual, page_url: v.pageUrl,
        user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null, user_id: user?.id ?? null,
        ...(file && { attachment: new Uint8Array(file.bytes), attachment_name: file.name, attachment_type: file.type, attachment_size: file.bytes.length }),
      },
    });
  } catch (error) {
    console.error("[support] could not save message", error);
    return fail(500, { error: "server" });
  }

  // Email is a convenience copy; the database row is the record. Runs after the response so it never slows the form down.
  after(async () => {
    const rows: [string, string | null][] = [
      ["Reference", reference], ["Type", v.kind], ["Category", v.category], ["Subject", v.subject],
      ["Name", v.name], ["Email", v.email], ["Account", user?.email ?? null], ["Rating", v.rating ? `${v.rating} / 5` : null],
      ["Page", v.pageUrl], ["Steps to reproduce", v.steps], ["Expected", v.expected], ["Actual", v.actual],
      ["Attachment", file ? `${file.name} (${Math.round(file.bytes.length / 1024)} KB)` : null], ["Message", v.message],
    ];
    const filled = rows.filter((r): r is [string, string] => !!r[1]);
    const ok = await sendEmail({
      to: process.env.SUPPORT_EMAIL || CONTACT.email,
      replyTo: v.email ?? undefined,
      subject: `[DL Typing ${v.kind}] ${v.subject} (${reference})`,
      text: filled.map(([k, val]) => `${k}: ${val}`).join("\n\n"),
      html: `<table cellpadding="6" style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px">${filled
        .map(([k, val]) => `<tr><th align="left" valign="top" style="color:#64748b;white-space:nowrap">${escapeHtml(k)}</th><td style="white-space:pre-wrap">${escapeHtml(val)}</td></tr>`)
        .join("")}</table>`,
      attachments: file ? [{ filename: file.name, content: file.bytes, contentType: file.type }] : undefined,
    });
    if (!ok) console.error(`[support] saved ${reference} but could not email a copy`);
  });

  return Response.json({ ok: true, reference });
}
