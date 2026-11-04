import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const { generateCode, hashCode, codesMatch, isPlausibleCode, isExpired, verificationEmail, CODE_TTL_MS, MAX_CODE_ATTEMPTS } = await import("@/lib/verification-core");

test("codes are 6 digits, padded, and vary", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const c = generateCode();
    assert.match(c, /^\d{6}$/);
    seen.add(c);
  }
  assert.ok(seen.size > 100);
});

test("only a salted hash is stored and it compares safely", () => {
  assert.equal(hashCode("user-a", "123456"), hashCode("user-a", "123456"));
  assert.notEqual(hashCode("user-a", "123456"), hashCode("user-b", "123456"));
  assert.notEqual(hashCode("user-a", "123456"), hashCode("user-a", "123457"));
  assert.match(hashCode("user-a", "123456"), /^[0-9a-f]{64}$/);
  assert.ok(codesMatch(hashCode("u", "000001"), hashCode("u", "000001")));
  assert.ok(!codesMatch(hashCode("u", "000001"), hashCode("u", "000002")));
  assert.ok(!codesMatch("short", hashCode("u", "000001")));
});

test("obviously bad codes are rejected before touching the database", () => {
  assert.ok(isPlausibleCode("004217"));
  for (const bad of [undefined, null, 123456, "", "12345", "1234567", "12 456", "abcdef", "123456\n"]) assert.equal(isPlausibleCode(bad), false);
});

test("codes expire after 10 minutes and allow a few guesses", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  assert.equal(CODE_TTL_MS, 10 * 60 * 1000);
  assert.equal(isExpired(new Date(now.getTime() + CODE_TTL_MS), now), false);
  assert.equal(isExpired(new Date(now.getTime() - 1), now), true);
  assert.equal(isExpired(now, now), true);
  assert.ok(MAX_CODE_ATTEMPTS >= 3 && MAX_CODE_ATTEMPTS <= 10);
});

test("the email shows the code and escapes the name", () => {
  const mail = verificationEmail("004217", "Dalen");
  assert.ok(mail.text.includes("004217") && mail.html.includes("004217") && mail.subject.includes("004217"));
  assert.ok(mail.text.includes("Hi Dalen"));
  const hostile = verificationEmail("004217", "<script>alert(1)</script>");
  assert.ok(!hostile.html.includes("<script>"));
  assert.ok(!verificationEmail("004217").text.includes("Hi "));
});

test("signup asks for a name, stays signed out, and login refuses unverified accounts (wiring checks)", () => {
  const signup = readFileSync("src/app/api/auth/signup/route.ts", "utf8");
  assert.ok(!signup.includes("createSession"), "signup must not create a session");
  assert.match(signup, /parseName/);
  assert.match(signup, /pendingVerification: true/);
  const login = readFileSync("src/app/api/auth/login/route.ts", "utf8");
  assert.match(login, /email_verified_at/);
  assert.ok(login.indexOf("verifyPassword") < login.indexOf("email_verified_at"), "unverified is only revealed after the password checks out");
  const auth = readFileSync("src/lib/auth.ts", "utf8");
  assert.match(auth, /getSessionUser[\s\S]*email_verified_at/);
  const verify = readFileSync("src/app/api/auth/verify/route.ts", "utf8");
  assert.ok(!verify.includes("createSession"), "verifying a code must not sign anyone in");
  assert.match(verify, /MAX_CODE_ATTEMPTS/);
  const migration = readFileSync("db/migrations/005_signup_name_otp.sql", "utf8");
  assert.match(migration, /add column name/);
  assert.match(migration, /add column attempts/);
});
