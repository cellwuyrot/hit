import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { products: true } },
      children: {
        orderBy: { order: "asc" },
        include: { _count: { select: { products: true } } },
      },
    },
  });
  return Response.json(categories);
}
