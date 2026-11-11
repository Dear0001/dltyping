// npm run i18n:check  — verifies English/Khmer completeness. Add --strict to also fail on hardcoded English in components.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const msgDir = path.join(root, "src/lib/i18n/messages");
const strict = process.argv.includes("--strict");
const errors = [], warnings = [];

// 1. Dictionary: key → {en, km}
const table = new Map();
const entry = /^\s*("(?:[^"\\]|\\.)+"):\s*\{\s*en:\s*("(?:[^"\\]|\\.)*"),\s*km:\s*("(?:[^"\\]|\\.)*")\s*\},?\s*$/;
for (const file of fs.readdirSync(msgDir).filter((f) => f.endsWith(".ts"))) {
  const lines = fs.readFileSync(path.join(msgDir, file), "utf8").split("\n");
  lines.forEach((line, i) => {
    if (!/^\s*"[\w.\-]+":/.test(line)) return;
    const m = line.match(entry);
    if (!m) return errors.push(`${file}:${i + 1} malformed entry (keep one "key": { en: "…", km: "…" } per line)`);
    const [key, en, km] = [JSON.parse(m[1]), JSON.parse(m[2]), JSON.parse(m[3])];
    if (table.has(key)) errors.push(`${file}:${i + 1} duplicate key ${key}`);
    table.set(key, { en, km, file });
  });
}
const ph = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
const khmer = /[ក-៿]/;
for (const [key, { en, km, file }] of table) {
  if (!en.trim()) errors.push(`${file}: ${key} has empty English`);
  if (!km.trim() && en.trim().length > 5) errors.push(`${file}: ${key} has empty Khmer`);
  else if (km.trim() && ph(en) !== ph(km)) errors.push(`${file}: ${key} placeholders differ (en {${ph(en)}} vs km {${ph(km)}})`);
  else if (!khmer.test(km) && /[A-Za-z]{4,}/.test(km) && km === en) warnings.push(`${file}: ${key} Khmer is identical to English`);
}

// 1b. Every namespace file must be registered in index.ts
const indexSrc = fs.readFileSync(path.join(root, "src/lib/i18n/index.ts"), "utf8");
for (const file of fs.readdirSync(msgDir).filter((f) => f.endsWith(".ts"))) {
  const name = file.replace(/\.ts$/, "");
  if (!new RegExp(`import ${name} from "\\./messages/${name}"`).test(indexSrc) || !new RegExp(`namespaces[^=]*=\\s*\\{[^}]*\\b${name}\\b`).test(indexSrc)) errors.push(`${file} is not registered in src/lib/i18n/index.ts`);
}

// 2. Source scan
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) { if (!["generated", "node_modules"].includes(f.name)) walk(p); }
    else if (/\.tsx?$/.test(f.name)) files.push(p);
  }
})(path.join(root, "src"));

const used = new Set();
const hard = new Map();
for (const f of files) {
  const rel = path.relative(root, f);
  const src = fs.readFileSync(f, "utf8");
  if (rel.includes("lib/i18n/")) continue;
  for (const m of src.matchAll(/["'`]([a-z]+\.[\w.\-]+)["'`]/g)) if (table.has(m[1])) used.add(m[1]); // any literal that is a key (covers key tables)
  for (const m of src.matchAll(/\b(?:t|tr)\(\s*(["'])([\w.\-]+)\1/g)) {
    used.add(m[2]);
    if (!table.has(m[2])) errors.push(`${rel}: t("${m[2]}") has no dictionary entry`);
  }
  for (const m of src.matchAll(/\b(?:t|tr)\(\s*`([\w.\-]*)\$\{/g)) for (const k of table.keys()) if (k.startsWith(m[1])) used.add(k);
  if (rel.endsWith(".tsx") && !rel.includes("/skeleton/")) {
    const n = (src.match(/>\s*[A-Z][a-z]+[^<>{}"]*[a-z]<|(?:placeholder|title|aria-label|alt)="[A-Z][a-z]+[^"]*"/g) || []).length;
    if (n) hard.set(rel, n);
  }
}
const unused = [...table.keys()].filter((k) => !used.has(k));
if (unused.length) warnings.push(`${unused.length} dictionary keys never referenced in code: ${unused.join(", ")}`);
const hardTotal = [...hard.values()].reduce((a, b) => a + b, 0);
if (hardTotal) (strict ? errors : warnings).push(`${hardTotal} probable hardcoded English strings in ${hard.size} files:\n` + [...hard].sort((a, b) => b[1] - a[1]).map(([f, n]) => `    ${n}\t${f}`).join("\n"));

console.log(`i18n: ${table.size} keys checked (en + km)`);
warnings.forEach((w) => console.warn("warn  " + w));
errors.forEach((e) => console.error("ERROR " + e));
process.exit(errors.length ? 1 : 0);
