import { prisma } from "@/lib/prisma";

const BOT_PATTERNS = /bot|crawl|spider|slurp|googlebot|yandexbot|bingbot|baiduspider|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|semrushbot|ahrefsbot|mj12bot|dotbot|rogerbot|screaming|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot/i;

export async function POST(request: Request) {
  try {
    const ua = request.headers.get("user-agent") || "";
    if (BOT_PATTERNS.test(ua)) {
      return Response.json({ ok: true, bot: true });
    }

    const { path, vid, source, medium } = await request.json();
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const hour = now.getHours();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const visitorId = vid || ip;
    const pagePath = path || "/";

    // Отдельный обезличенный срез: только первый источник за день для известной опубликованной кампании.
    // Метки не являются подтверждёнными кликами рекламной площадки.
    if (typeof path === "string" && /^\/campaign\/[a-z0-9-]{1,160}$/.test(path) && typeof vid === "string" && /^[0-9a-f-]{36}$/i.test(vid)) {
      const campaign = await prisma.campaign.findFirst({ where: { slug: path.slice("/campaign/".length), published: true }, select: { id: true } });
      if (campaign) {
        const safeTag = (value: unknown, fallback: string) => typeof value === "string" && /^[a-zA-Z0-9_.-]{1,80}$/.test(value) ? value.toLowerCase() : fallback;
        await prisma.campaignAttribution.upsert({ where: { campaignId_date_visitorId: { campaignId: campaign.id, date, visitorId: vid } }, update: {}, create: { campaignId: campaign.id, date, visitorId: vid, source: safeTag(source, "direct_or_unknown"), medium: safeTag(medium, "unknown") } });
      }
    }
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
