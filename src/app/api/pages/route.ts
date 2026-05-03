import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const page = await prisma.sitePage.findUnique({ where: { slug } });
    return Response.json(page || { slug, title: "", content: "" });
  }

  const pages = await prisma.sitePage.findMany({ orderBy: { slug: "asc" } });
  return Response.json(pages);
}
