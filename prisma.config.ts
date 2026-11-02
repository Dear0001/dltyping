import { defineConfig } from "prisma/config";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Env may already be provided by the shell / Vercel.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "" },
});
