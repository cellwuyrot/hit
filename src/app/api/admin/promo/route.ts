import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
const unauthorized = () => Response.json({ error: "Нет доступа" }, { status: 401 });
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();
  return Response.json(await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } }));
}
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const body = await req.json();
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!/^[A-ZА-ЯЁ0-9_-]{1,64}$/u.test(code)) return Response.json({ error: "Код: 1–64 буквы, цифры, дефис или подчёркивание" }, { status: 400 });
    const { discountType, discountValue, minOrder = 0, maxUses = 0, active = true } = body;
    if (!["percent", "fixed"].includes(discountType) || typeof discountValue !== "number" || !Number.isFinite(discountValue) || discountValue <= 0 || (discountType === "percent" && discountValue > 100) ||
      typeof minOrder !== "number" || !Number.isFinite(minOrder) || minOrder < 0 || !Number.isInteger(maxUses) || maxUses < 0 || typeof active !== "boolean") {
      return Response.json({ error: "Укажите положительную скидку (процент до 100), неотрицательный минимум и целый лимит" }, { status: 400 });
    }
    const startsAt = body.startsAt ? new Date(body.startsAt) : null;
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if ((startsAt && isNaN(startsAt.getTime())) || (expiresAt && isNaN(expiresAt.getTime())) || (startsAt && expiresAt && startsAt > expiresAt)) return Response.json({ error: "Некорректный период действия" }, { status: 400 });
    const data = { code, discountType, discountValue, minOrder, maxUses, active, startsAt, expiresAt };
    const promo = body.id ? await prisma.promoCode.update({ where: { id: body.id }, data }) : await prisma.promoCode.create({ data });
    return Response.json(promo);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return Response.json({ error: "Промокод с таким кодом уже существует" }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return Response.json({ error: "Промокод не найден" }, { status: 404 });
    return Response.json({ error: "Не удалось сохранить промокод" }, { status: 400 });
  }
}
export async function DELETE(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const { id } = await req.json();
    await prisma.promoCode.delete({ where: { id } });
    return Response.json({ success: true });
  } catch { return Response.json({ error: "Промокод не найден" }, { status: 404 }); }
}
