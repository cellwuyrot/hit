import { prisma } from "@/lib/prisma";

export async function GET() {
  const news = await prisma.news.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      image: true,
      type: true,
      published: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return Response.json(news);
}
