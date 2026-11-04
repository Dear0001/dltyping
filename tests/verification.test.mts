import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const { generateToken, hashToken, isExpired, isPlausibleToken, verificationEmail, verificationLink, VERIFY_TTL_MS } = await import("@/lib/verification-core");

test("tokens are long, unique and URL-safe, and only their hash is meant to be stored", () => {
  const a = generateToken(), b = generateToken();
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9_-]{43}$/);
  assert.ok(isPlausibleToken(a));
  assert.equal(hashToken(a), hashToken(a));
  assert.notEqual(hashToken(a), hashToken(b));
  assert.notEqual(hashToken(a), a);
  assert.match(hashToken(a), /^[0-9a-f]{64}$/);
});

test("obviously bad tokens are rejected before touching the database", () => {
  for (const bad of [undefined, null, 42, "", "short", "has space in it and is long enough!!", "a".repeat(101), "../../etc/passwd/................"]) assert.equal(isPlausibleToken(bad), false);
});

test("links expire after 24 hours", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  assert.equal(VERIFY_TTL_MS, 24 * 3600 * 1000);
  assert.equal(isExpired(new Date(now.getTime() + VERIFY_TTL_MS), now), false);
  assert.equal(isExpired(new Date(now.getTime() - 1), now), true);
  assert.equal(isExpired(now, now), true);
});

test("the verification link points at the site and carries the token; the email escapes it", () => {
  const link = verificationLink("https://dl.example.com/", "abc_DEF-123");
  assert.equal(link, "https://dl.example.com/verify-email?token=abc_DEF-123");
  const mail = verificationEmail(link);
  assert.ok(mail.text.includes(link) && mail.html.includes(link));
  assert.match(mail.subject, /verify/i);
  const hostile = verificationEmail('https://x.test/?a="><script>alert(1)</script>');
  assert.ok(!hostile.html.includes("<script>"));
});

test("signup no longer signs anyone in, and login refuses unverified accounts (wiring checks)", () => {
  const signup = readFileSync("src/app/api/auth/signup/route.ts", "utf8");
  assert.ok(!signup.includes("createSession"), "signup must not create a session");
  assert.match(signup, /pendingVerification: true/);
  const login = readFileSync("src/app/api/auth/login/route.ts", "utf8");
  assert.match(login, /email_verified_at/);
  assert.ok(login.indexOf("verifyPassword") < login.indexOf("email_verified_at"), "unverified is only revealed after the password checks out");
  const auth = readFileSync("src/lib/auth.ts", "utf8");
  assert.match(auth, /getSessionUser[\s\S]*email_verified_at/);
  const migration = readFileSync("db/migrations/004_email_verification.sql", "utf8");
  assert.match(migration, /set email_verified_at = created_at/, "existing accounts stay usable");
});
