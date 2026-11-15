import { SEALED_HEADER, open, seal } from "@/lib/secure-api";

/**
 * Wraps a route handler so sealed requests (see secureFetch) are decrypted before the handler runs and its
 * response is encrypted on the way out. Plain requests pass straight through unchanged.
 */
export function sealed<C = unknown>(handler: (request: Request, ctx: C) => Promise<Response> | Response) {
  return async (request: Request, ctx: C): Promise<Response> => {
    if (request.headers.get(SEALED_HEADER) !== "1") return handler(request, ctx);

    let inner = request;
    if (request.method !== "GET" && request.method !== "HEAD") {
      const plain = await open(await request.text());
      if (plain === null) return new Response(await seal(JSON.stringify({ error: "invalid" })), { status: 400, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
      inner = new Request(request.url, { method: request.method, headers: request.headers, body: plain });
    }
    const res = await handler(inner, ctx);
    const headers = new Headers(res.headers);
    headers.set("Content-Type", "application/json");
    headers.set("Cache-Control", "no-store");
    headers.delete("content-length");
    return new Response(await seal(await res.text()), { status: res.status, statusText: res.statusText, headers });
  };
}
