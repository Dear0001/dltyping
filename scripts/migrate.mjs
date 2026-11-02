// Applies db/migrations/*.sql in order. Usage: npm run db:migrate
import { neon } from "@neondatabase/serverless";
import { readdir, readFile } from "node:fs/promises";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("Set DATABASE_URL_UNPOOLED or DATABASE_URL (npm run db:migrate loads .env.local)");
const sql = neon(url);

await sql.query("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())");
const done = new Set((await sql.query("select name from schema_migrations")).map((r) => r.name));
const files = (await readdir("db/migrations")).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  if (done.has(file)) { console.log("skip ", file); continue; }
  const statements = (await readFile(`db/migrations/${file}`, "utf8")).split(/^-- split\s*$/m).map((s) => s.trim()).filter(Boolean);
  for (const statement of statements) await sql.query(statement);
  await sql.query("insert into schema_migrations (name) values ($1)", [file]);
  console.log("apply", file, `(${statements.length} statements)`);
}
