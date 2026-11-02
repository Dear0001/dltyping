// Normalize canonically equivalent Khmer sequences before comparing typed input.
export function normalizeKhmer(value: string) {
  return value.normalize("NFC").replace(/[\u200B\u200C\u200D\uFEFF]/g, "");
}

export function isKhmerText(value: string) {
  return /^[\u1780-\u17FF\s\u200B\u200C\u200D\uFEFF]*$/.test(value);
}

export function splitKhmerClusters(value: string) {
  return Array.from(normalizeKhmer(value));
}
