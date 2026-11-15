import { SEALED_HEADER, open, seal } from "@/lib/secure-api";

/**
 * Drop-in `fetch` for our own /api routes: the string body is encrypted before sending and the response is decrypted,
 * so the Network tab shows only ciphertext. Resolves to an ordinary Response (status, ok and json() work as usual).
 */
export async function secureFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set(SEALED_HEADER, "1");
  let body = init.body;
  if (typeof body === "string") {
    body = await seal(body);
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...init, headers, body });
  const plain = await open(await res.text());
  // Not an envelope (e.g. a platform error page): hand back an empty body rather than garbage.
  return new Response(plain ?? "{}", { status: res.status, headers: { "Content-Type": "application/json" } });
}
