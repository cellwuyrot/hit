import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { path } = await request.json();
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const hour = now.getHours();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const pagePath = path || "/";

    // Deduplicate: 1 IP = 1 record per page per day
    const existing = await prisma.pageView.findFirst({
      where: { date, visitorId: ip, path: pagePath },
    });
    if (existing) {
      return Response.json({ ok: true, duplicate: true });
    }

    await prisma.pageView.create({ data: { path: pagePath, date, hour, visitorId: ip } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
