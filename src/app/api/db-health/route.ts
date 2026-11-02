import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [row] = await prisma.$queryRaw<{ now: Date; db: string }[]>`select now() as now, current_database() as db`;
    return Response.json({ ok: true, ...row });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "unknown" }, { status: 500 });
  }
}
