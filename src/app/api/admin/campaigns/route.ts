import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

function isAdmin(request: Request) {
  const token = getTokenFromRequest(request);
  return !!token && verifyToken(token)?.role === "admin";
}
function validImage(s: string) {
  if (!s) return true;
  if (s.startsWith("/") && !s.startsWith("//")) return true;
  try { return ["http:", "https:"].includes(new URL(s).protocol); } catch { return false; }
}
async function parse(request: Request) {
  const body: unknown = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Некорректные данные кампании");
  const b = body as Record<string, unknown>;
  function text(key: string, limit: number, required = false) {
    if (b[key] !== undefined && typeof b[key] !== "string") throw new Error(`Поле ${key} должно быть текстом`);
    const value = (typeof b[key] === "string" ? b[key] : "").trim();
    if ((required && !value) || value.length > limit) throw new Error(`Проверьте поле ${key}: максимум ${limit} символов`);
    return value;
  }
  const name = text("name", 150, true), heading = text("heading", 200, true), description = text("description", 3000);
  const metaTitle = text("metaTitle", 200), metaDescription = text("metaDescription", 400), image = text("image", 1000);
  if (!validImage(image)) throw new Error("Укажите корректный адрес изображения");
  if (typeof b.published !== "boolean" || typeof b.allowIndex !== "boolean") throw new Error("Проверьте статус публикации");
  if (!Array.isArray(b.productIds) || b.productIds.length > 100 || b.productIds.some(x => typeof x !== "string" || x.length > 100)) throw new Error("Выберите не более 100 товаров");
  const productIds = [...new Set(b.productIds as string[])];
  if (b.published && !productIds.length) throw new Error("Для публикации выберите хотя бы один товар");
  if (await prisma.product.count({ where: { id: { in: productIds } } }) !== productIds.length) throw new Error("Некоторые товары не найдены. Обновите страницу.");
  return { name, heading, description, metaTitle, metaDescription, image, published: b.published, allowIndex: b.allowIndex, productIds };
}
export async function GET(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  const campaigns = await prisma.campaign.findMany({ orderBy: { updatedAt: "desc" }, include: { products: { select: { productId: true } } } });
  const from = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const views = await prisma.pageView.groupBy({ by: ["path"], where: { date: { gte: from }, path: { in: campaigns.map(c => `/campaign/${c.slug}`) } }, _count: { id: true } });
  const counts = new Map(views.map(v => [v.path, v._count.id]));
  const attribution = await prisma.campaignAttribution.groupBy({ by: ["campaignId", "source", "medium"], where: { date: { gte: from }, campaignId: { in: campaigns.map(c => c.id) } }, _count: { visitorId: true }, orderBy: { _count: { visitorId: "desc" } } });
  return Response.json(campaigns.map(c => ({ ...c, productIds: c.products.map(p => p.productId), visits30: counts.get(`/campaign/${c.slug}`) || 0, sources: attribution.filter(a => a.campaignId === c.id).map(a => ({ source: a.source, medium: a.medium, visits: a._count.visitorId })), products: undefined })));
}
export async function POST(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  try {
    const { productIds, ...data } = await parse(request);
    const base = slugify(data.name).slice(0, 120).replace(/-+$/, "") || "campaign";
    let slug = base, suffix = 2;
    while (await prisma.campaign.findUnique({ where: { slug } })) slug = `${base}-${suffix++}`;
    const campaign = await prisma.campaign.create({ data: { ...data, slug, products: { create: productIds.map(productId => ({ productId })) } } });
    return Response.json(campaign, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Не удалось создать кампанию" }, { status: 400 }); }
}
export async function PUT(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  try {
    const body = await request.clone().json();
    if (!body || typeof body.id !== "string") throw new Error("Не указана кампания");
    const { productIds, ...data } = await parse(request);
    if (!await prisma.campaign.findUnique({ where: { id: body.id }, select: { id: true } })) return Response.json({ error: "Кампания не найдена" }, { status: 404 });
    await prisma.$transaction(async tx => {
      await tx.campaign.update({ where: { id: body.id }, data });
      await tx.campaignProduct.deleteMany({ where: { campaignId: body.id } });
      if (productIds.length) await tx.campaignProduct.createMany({ data: productIds.map(productId => ({ campaignId: body.id, productId })) });
    });
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Не удалось сохранить кампанию" }, { status: 400 }); }
}
