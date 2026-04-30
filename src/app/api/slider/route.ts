import { prisma } from "@/lib/prisma";

export async function GET() {
  const slides = await prisma.sliderImage.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return Response.json(slides);
}
