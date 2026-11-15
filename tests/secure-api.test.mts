import { test } from "node:test";
const assert = (await import("node:assert/strict")).default;
const { seal, open } = await import("@/lib/secure-api");
const { sealed } = await import("@/lib/secure-route");

test("sealed routes hide request and response bodies and still work", async () => {
  const envelope = await seal(JSON.stringify({ password: "hunter2" }));
  assert.ok(!envelope.includes("hunter2"));
  const handler = sealed(async (r: Request) => Response.json({ got: await r.json() }, { status: 201 }));
  const res = await handler(new Request("http://x/api", { method: "POST", headers: { "x-sealed": "1" }, body: envelope }), undefined);
  const text = await res.text();
  assert.equal(res.status, 201);
  assert.ok(!text.includes("hunter2"));
  assert.deepEqual(JSON.parse((await open(text))!), { got: { password: "hunter2" } });
});

test("tampered envelopes are rejected", async () => {
  const handler = sealed(async () => Response.json({ ok: true }));
  const res = await handler(new Request("http://x/api", { method: "POST", headers: { "x-sealed": "1" }, body: '{"d":"AAAA"}' }), undefined);
  assert.equal(res.status, 400);
});

test("plain requests pass through", async () => {
  const res = await sealed(async () => Response.json({ ok: true }))(new Request("http://x/api"), undefined);
  assert.deepEqual(await res.json(), { ok: true });
});

test("sealed JSON survives a stale content-length header", async () => {
  const envelope = await seal(JSON.stringify({ a: "x".repeat(500) }));
  const handler = sealed(async (r: Request) => Response.json({ n: (await r.json()).a.length }));
  const res = await handler(new Request("http://x/api", { method: "POST", headers: { "x-sealed": "1", "content-length": String(envelope.length) }, body: envelope }), undefined);
  assert.deepEqual(JSON.parse((await open(await res.text()))!), { n: 500 });
});
