import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

const LAYOUTS = ["hero", "split-right", "split-left", "features", "stats", "quote", "banner", "cta"];
const BG_COLORS = ["white", "light", "gradient", "primary", "accent", "dark"];
const ALIGNS = ["left", "center"];

type BlockInput = {
  layout?: string;
  bgColor?: string;
  align?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  text?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  order?: number;
  active?: boolean;
};

function normalize(body: BlockInput) {
  return {
    layout: LAYOUTS.includes(body.layout ?? "") ? body.layout! : "split-right",
    bgColor: BG_COLORS.includes(body.bgColor ?? "") ? body.bgColor! : "white",
    align: ALIGNS.includes(body.align ?? "") ? body.align! : "left",
    eyebrow: body.eyebrow ?? "",
    title: body.title ?? "",
    subtitle: body.subtitle ?? "",
    text: body.text ?? "",
    imageUrl: body.imageUrl ?? "",
    buttonText: body.buttonText ?? "",
    buttonLink: body.buttonLink ?? "",
    order: typeof body.order === "number" ? body.order : 0,
    active: body.active !== false,
  };
}

export async function GET(request: Request) {
  if (checkAdmin(request)) {
    const blocks = await prisma.presentationBlock.findMany({ orderBy: { order: "asc" } });
    return Response.json(blocks);
  }

  const blocks = await prisma.presentationBlock.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return Response.json(blocks);
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = (await request.json()) as BlockInput;
  const data = normalize(body);
  const block = await prisma.presentationBlock.create({ data });
  return Response.json(block, { status: 201 });
}

export async function PUT(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = (await request.json()) as BlockInput & { id?: string };
  if (!body.id) {
    return Response.json({ error: "ID обязателен" }, { status: 400 });
  }

  const data = normalize(body);
  const block = await prisma.presentationBlock.update({ where: { id: body.id }, data });
  return Response.json(block);
}

export async function PATCH(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { orderedIds } = (await request.json()) as { orderedIds?: string[] };
  if (!Array.isArray(orderedIds)) {
    return Response.json({ error: "orderedIds обязателен" }, { status: 400 });
  }

  await Promise.all(
    orderedIds.map((id: string, index: number) =>
      prisma.presentationBlock.update({ where: { id }, data: { order: index } })
    )
  );

  const blocks = await prisma.presentationBlock.findMany({ orderBy: { order: "asc" } });
  return Response.json(blocks);
}

export async function DELETE(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return Response.json({ error: "ID обязателен" }, { status: 400 });
  }

  await prisma.presentationBlock.delete({ where: { id } });
  return Response.json({ success: true });
}
