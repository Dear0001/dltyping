const assert = (await import("node:assert/strict")).default;
const { test } = await import("node:test");
const s = await import("@/lib/support");

const ok = { category: "general", name: "Sokha", email: "Sokha@Example.com ", subject: "Hello there", message: "I have a question about lessons." };

test("contact needs name and email; valid input is normalised", () => {
  const r = s.validateSupport("contact", ok);
  assert.ok("value" in r);
  assert.equal(r.value.email, "sokha@example.com");
  const bad = s.validateSupport("contact", { ...ok, name: "", email: "" });
  assert.deepEqual("errors" in bad && bad.errors, { name: "required", email: "required" });
});

test("feedback: email optional, rating 1-5, category from its own list", () => {
  const base = { category: "feature", subject: "More games", message: "Please add a Khmer racing game." };
  assert.ok("value" in s.validateSupport("feedback", base));
  const r = s.validateSupport("feedback", { ...base, rating: "4" });
  assert.ok("value" in r && r.value.rating === 4);
  const bad = s.validateSupport("feedback", { ...base, rating: "9", category: "keyboard", email: "nope" });
  assert.deepEqual("errors" in bad && bad.errors, { rating: "invalid", category: "invalid", email: "email" });
});

test("report: page URL must be http(s); details length-limited; other kinds ignore report fields", () => {
  const base = { category: "keyboard", subject: "Wrong letter", message: "The key for ក shows ខ instead." };
  const r = s.validateSupport("report", { ...base, pageUrl: "https://dltyping.com/learn/khmer", steps: "1. open" });
  assert.ok("value" in r && r.value.pageUrl === "https://dltyping.com/learn/khmer" && r.value.steps === "1. open");
  const bad = s.validateSupport("report", { ...base, pageUrl: "javascript:alert(1)", actual: "x".repeat(2001) });
  assert.deepEqual("errors" in bad && bad.errors, { pageUrl: "url", actual: "long" });
  const c = s.validateSupport("contact", { ...ok, pageUrl: "javascript:x", steps: "y" });
  assert.ok("value" in c && c.value.pageUrl === null && c.value.steps === null);
});

test("subject and message length rules; unknown kind rejected", () => {
  const e = s.validateSupport("feedback", { category: "ui", subject: "ab", message: "short" });
  assert.deepEqual("errors" in e && e.errors, { subject: "short", message: "short" });
  assert.ok("errors" in s.validateSupport("spam", ok));
});

test("file sniffing trusts bytes, not names", () => {
  assert.equal(s.sniffFileType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), "image/png");
  assert.equal(s.sniffFileType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31])), "application/pdf");
  assert.equal(s.sniffFileType(new TextEncoder().encode("<html>")), null);
  assert.equal(s.checkAttachmentMeta({ type: "image/png", size: 4 * 1024 * 1024 }), "fileSize");
  assert.equal(s.checkAttachmentMeta({ type: "text/html", size: 10 }), "fileType");
  assert.match(s.referenceFor("1a2b3c4d-0000-0000-0000-000000000000"), /^DLT-1A2B3C4D$/);
  assert.equal(s.safeFileName("../../etc/<pass>.png"), ".._.._etc_pass_.png");
});
