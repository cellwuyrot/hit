import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { path } = await request.json();
    const date = new Date().toISOString().split("T")[0];
    await prisma.pageView.create({ data: { path: path || "/", date } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
