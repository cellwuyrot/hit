import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

export async function GET(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "week";

  const now = new Date();
  let daysBack = 7;
  if (period === "day") daysBack = 1;
  else if (period === "month") daysBack = 30;

  const dates: string[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const views = await prisma.pageView.groupBy({
    by: ["date"],
    where: { date: { gte: startDate, lte: endDate } },
    _count: { id: true },
  });

  const viewMap = new Map(views.map((v) => [v.date, v._count.id]));

  const data = dates.map((date) => ({
    date,
    views: viewMap.get(date) || 0,
  }));

  const totalViews = data.reduce((sum, d) => sum + d.views, 0);

  const topPages = await prisma.pageView.groupBy({
    by: ["path"],
    where: { date: { gte: startDate, lte: endDate } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  return Response.json({
    period,
    data,
    totalViews,
    topPages: topPages.map((p) => ({ path: p.path, views: p._count.id })),
  });
}
