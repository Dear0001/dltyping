/** Shared rules for the support pages (Contact Us, Feedback, Report a Problem). Used by the forms and by /api/support. */

export const CONTACT = {
  email: "dalensophea34@gmail.com",
  linkedin: "https://www.linkedin.com/in/dalen-phea-390148260/",
  github: "https://github.com/Dear0001",
} as const;

export const SUPPORT_KINDS = ["contact", "feedback", "report"] as const;
export type SupportKind = (typeof SUPPORT_KINDS)[number];
export const isSupportKind = (v: unknown): v is SupportKind => SUPPORT_KINDS.includes(v as SupportKind);

/** Category ids per form; labels live in `support.cat.<kind>.<id>`. */
export const CATEGORIES = {
  contact: ["general", "learning", "account", "partnership", "other"],
  feedback: ["ui", "practice", "games", "english", "khmer", "feature", "other"],
  report: ["practice", "keyboard", "games", "english", "khmer", "account", "links", "performance", "other"],
} as const satisfies Record<SupportKind, readonly string[]>;

export const LIMITS = {
  name: 50,
  email: 254,
  subjectMin: 3,
  subjectMax: 120,
  messageMin: 10,
  messageMax: 3000,
  detailMax: 2000,
  pageUrlMax: 500,
} as const;

/** Allowed uploads: screenshots and PDFs up to 3 MB. The server checks the real file bytes, not just the browser's MIME type. */
export const ATTACHMENT = {
  maxBytes: 3 * 1024 * 1024,
  types: ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"] as readonly string[],
  accept: ".png,.jpg,.jpeg,.webp,.gif,.pdf,image/png,image/jpeg,image/webp,image/gif,application/pdf",
};

export const TEXT_FIELDS = ["name", "email", "category", "subject", "message", "rating", "steps", "expected", "actual", "pageUrl"] as const;
export type TextField = (typeof TEXT_FIELDS)[number];
export type FieldName = TextField | "attachment";
/** Error codes map to `support.err.<code>` translation keys. */
export type ErrCode = "required" | "email" | "short" | "long" | "invalid" | "url" | "fileType" | "fileSize";
export type FieldErrors = Partial<Record<FieldName, ErrCode>>;
export type SupportFields = Partial<Record<TextField, string>>;

export type SupportValue = {
  kind: SupportKind;
  name: string | null;
  email: string | null;
  category: string;
  subject: string;
  message: string;
  rating: number | null;
  steps: string | null;
  expected: string | null;
  actual: string | null;
  pageUrl: string | null;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const oneLine = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const multiLine = (s: string | undefined) => (s ?? "").replace(/\r\n?/g, "\n").trim();

/** Validates one submission. Returns every field error at once so the form can mark them all. */
export function validateSupport(kind: unknown, f: SupportFields): { value: SupportValue } | { errors: FieldErrors } {
  if (!isSupportKind(kind)) return { errors: { category: "invalid" } };
  const errors: FieldErrors = {};

  const name = oneLine(f.name);
  if (kind === "contact" && !name) errors.name = "required";
  else if (name.length > LIMITS.name) errors.name = "long";
  else if (/[\u0000-\u001f\u007f<>]/.test(name)) errors.name = "invalid";

  const email = oneLine(f.email).toLowerCase();
  if (!email) { if (kind === "contact") errors.email = "required"; }
  else if (email.length > LIMITS.email || !EMAIL.test(email)) errors.email = "email";

  const category = oneLine(f.category);
  if (!category) errors.category = "required";
  else if (!(CATEGORIES[kind] as readonly string[]).includes(category)) errors.category = "invalid";

  const subject = oneLine(f.subject);
  if (!subject) errors.subject = "required";
  else if (subject.length < LIMITS.subjectMin) errors.subject = "short";
  else if (subject.length > LIMITS.subjectMax) errors.subject = "long";

  const message = multiLine(f.message);
  if (!message) errors.message = "required";
  else if (message.length < LIMITS.messageMin) errors.message = "short";
  else if (message.length > LIMITS.messageMax) errors.message = "long";

  let rating: number | null = null;
  if (kind === "feedback" && f.rating && f.rating !== "0") {
    rating = Number(f.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "invalid";
  }

  const detail = (key: "steps" | "expected" | "actual") => {
    if (kind !== "report") return null;
    const v = multiLine(f[key]);
    if (v.length > LIMITS.detailMax) errors[key] = "long";
    return v || null;
  };
  const steps = detail("steps");
  const expected = detail("expected");
  const actual = detail("actual");

  let pageUrl: string | null = null;
  if (kind === "report" && oneLine(f.pageUrl)) {
    pageUrl = oneLine(f.pageUrl);
    if (pageUrl.length > LIMITS.pageUrlMax || !isHttpUrl(pageUrl)) errors.pageUrl = "url";
  }

  if (Object.keys(errors).length) return { errors };
  return { value: { kind, name: name || null, email: email || null, category, subject, message, rating, steps, expected, actual, pageUrl } };
}

function isHttpUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Quick check on what the browser tells us about a file (before upload). */
export function checkAttachmentMeta(file: { type: string; size: number }): ErrCode | null {
  if (file.size > ATTACHMENT.maxBytes) return "fileSize";
  if (!ATTACHMENT.types.includes(file.type)) return "fileType";
  return null;
}

/** Detects the real file type from its first bytes. Returns null for anything that isn't an allowed type. */
export function sniffFileType(b: Uint8Array): string | null {
  const at = (i: number, ...bytes: number[]) => bytes.every((x, j) => b[i + j] === x);
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  if (at(0, 0x25, 0x50, 0x44, 0x46, 0x2d)) return "application/pdf";
  return null;
}

/** Short, human-friendly reference shown to the person after a report is saved. */
export const referenceFor = (id: string) => `DLT-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

/** Keeps an uploaded file's name safe to store and to show in an email. */
export const safeFileName = (name: string) => name.replace(/[^\w.\- ]+/g, "_").slice(-100) || "attachment";
