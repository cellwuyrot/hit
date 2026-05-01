import { prisma } from "@/lib/prisma";

export async function GET() {
  const news = await prisma.news.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(news);
}
