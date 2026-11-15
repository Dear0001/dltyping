// Shared by the browser and the route handlers: AES-GCM envelope for API bodies, so DevTools -> Network shows
// only `{"d":"<ciphertext>"}` instead of readable JSON. This is obfuscation, not secrecy: the key ships in the
// client bundle. Real protection still comes from the server-side checks (session, origin, validation, throttling).

export const SEALED_HEADER = "x-sealed";

const SECRET = process.env.NEXT_PUBLIC_API_SEAL_KEY || "dltyping-default-seal-key-change-me";

let keyPromise: Promise<CryptoKey> | null = null;
function getKey() {
  keyPromise ??= crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(SECRET))
    .then((raw) => crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]));
  return keyPromise;
}

export function toB64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function fromB64(text: string) {
  const s = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** Encrypts a text body into a JSON envelope string: {"d": iv+ciphertext}. */
export async function seal(plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await getKey(), new TextEncoder().encode(plain)));
  const packed = new Uint8Array(iv.length + data.length);
  packed.set(iv);
  packed.set(data, iv.length);
  return JSON.stringify({ d: toB64(packed) });
}

/** Reverses seal(). Returns null when the envelope is malformed or fails authentication. */
export async function open(envelope: string): Promise<string | null> {
  try {
    const { d } = JSON.parse(envelope) as { d?: unknown };
    if (typeof d !== "string") return null;
    const packed = fromB64(d);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: packed.slice(0, 12) }, await getKey(), packed.slice(12));
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}
