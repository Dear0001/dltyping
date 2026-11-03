// Test-only module hooks: resolves the "@/..." alias and extensionless relative imports to .ts/.tsx,
// so Node's built-in type stripping can run the project's pure modules without a bundler.
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = new URL("../src/", import.meta.url);
const tryExt = (base) => [".ts", ".tsx", "/index.ts"].map((e) => base + e).find((c) => existsSync(c));

export function resolve(specifier, context, next) {
  let base = null;
  if (specifier.startsWith("@/")) base = fileURLToPath(new URL(specifier.slice(2), SRC));
  else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:") && !/\.\w+$/.test(specifier)) base = fileURLToPath(new URL(specifier, context.parentURL));
  const found = base && tryExt(base);
  return next(found ? pathToFileURL(found).href : specifier, context);
}
