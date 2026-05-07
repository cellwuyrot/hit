import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { path } = await request.json();
    const date = new Date().toISOString().split("T")[0];
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    // Deduplicate: 1 IP = 1 record per day (regardless of page)
    const existingVisitor = await prisma.pageView.findFirst({
      where: { date, visitorId: ip },
    });
    if (existingVisitor) {
      return Response.json({ ok: true, duplicate: true });
    }

    await prisma.pageView.create({ data: { path: path || "/", date, visitorId: ip } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
