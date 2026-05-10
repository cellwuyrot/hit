import { prisma } from "@/lib/prisma";

const BOT_PATTERNS = /bot|crawl|spider|slurp|googlebot|yandexbot|bingbot|baiduspider|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|semrushbot|ahrefsbot|mj12bot|dotbot|rogerbot|screaming|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot/i;

export async function POST(request: Request) {
  try {
    const ua = request.headers.get("user-agent") || "";
    if (BOT_PATTERNS.test(ua)) {
      return Response.json({ ok: true, bot: true });
    }

    const { path, vid } = await request.json();
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const hour = now.getHours();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const visitorId = vid || ip;
    const pagePath = path || "/";

    const existing = await prisma.pageView.findFirst({
      where: { date, visitorId, path: pagePath },
    });
    if (existing) {
      return Response.json({ ok: true, duplicate: true });
    }

    await prisma.pageView.create({ data: { path: pagePath, date, hour, visitorId } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
