import { prisma } from "@/lib/prisma";
import { checkNewsAgentAuth } from "@/lib/news-agent-auth";
import { slugify } from "@/lib/slugify";

export const runtime = "nodejs";

type ArticleSection = { heading: string; text: string };

function plainText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\u0000/g, "").trim();
  if (text.length === 0 || text.length > maxLength) return null;
  return text;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || `news-${Date.now()}`;
  let slug = base;
  let counter = 2;
  while (await prisma.news.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

export async function POST(request: Request) {
  const authError = checkNewsAgentAuth(request);
  if (authError) return authError;

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > 24_000) {
    return Response.json(
      { error: "Размер запроса превышает 24 КБ." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "Передайте корректный JSON." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return Response.json(
      { error: "Ожидается объект новости." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const input = payload as Record<string, unknown>;
  const title = plainText(input.title, 100);
  const excerpt = plainText(input.excerpt, 220);
  const lead = plainText(input.lead, 600);
  if (!title || title.length < 10) {
    return Response.json(
      { error: "Заголовок должен содержать от 10 до 100 символов." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!excerpt || excerpt.length < 35) {
    return Response.json(
      { error: "Краткое описание должно содержать от 35 до 220 символов." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!lead || lead.length < 40) {
    return Response.json(
      { error: "Лид должен содержать от 40 до 600 символов." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!Array.isArray(input.sections) || input.sections.length < 2 || input.sections.length > 3) {
    return Response.json(
      { error: "Добавьте 2 или 3 смысловых раздела." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const sections: ArticleSection[] = [];
  for (const item of input.sections) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return Response.json(
        { error: "Каждый раздел должен содержать заголовок и текст." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    const section = item as Record<string, unknown>;
    const heading = plainText(section.heading, 70);
    const text = plainText(section.text, 1_000);
    if (!heading || !text || text.length < 50) {
      return Response.json(
        { error: "Заголовок раздела — до 70 символов, текст — от 50 до 1000." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    sections.push({ heading, text });
  }

  if (
    !Array.isArray(input.productIds) ||
    input.productIds.length < 1 ||
    input.productIds.length > 6 ||
    input.productIds.some((id) => typeof id !== "string" || id.length > 100)
  ) {
    return Response.json(
      { error: "Передайте от 1 до 6 идентификаторов товаров из каталога." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const productIds = [...new Set(input.productIds as string[])];
  if (productIds.length !== input.productIds.length) {
    return Response.json(
      { error: "Идентификаторы товаров не должны повторяться." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (input.publish !== undefined && typeof input.publish !== "boolean") {
    return Response.json(
      { error: "Параметр publish должен быть true или false." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const publish = input.publish === true;
  if (publish && process.env.NEWS_AGENT_ALLOW_PUBLISH !== "true") {
    return Response.json(
      { error: "Автопубликация выключена; сохраните новость как черновик или включите её отдельно." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const catalogProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, inStock: { gt: 0 } },
    select: { id: true, slug: true, name: true, brand: true, image: true },
  });
  if (catalogProducts.length !== productIds.length) {
    return Response.json(
      { error: "Один или несколько товаров удалены или больше не в наличии. Запросите нового кандидата." },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }
  const productById = new Map(catalogProducts.map((product) => [product.id, product]));
  const products = productIds.map((id) => productById.get(id)!);

  // Only the server creates markup. Model-provided strings are escaped and
  // catalog links are built from verified product slugs to avoid stored XSS.
  const content = [
    `<p><strong>${escapeHtml(lead)}</strong></p>`,
    ...sections.flatMap((section) => [
      `<h2>${escapeHtml(section.heading)}</h2>`,
      `<p>${escapeHtml(section.text)}</p>`,
    ]),
    "<h2>В каталоге ТОПХИТ</h2>",
    `<ul>${products.map((product) => {
      const label = [product.name, product.brand].filter(Boolean).join(" — ");
      const href = `/product/${encodeURIComponent(product.slug)}`;
      return `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`;
    }).join("")}</ul>`,
    "<p>Подробности о товарах и их актуальных характеристиках — на карточках каталога.</p>",
  ].join("\n");

  const slug = await uniqueSlug(title);
  const news = await prisma.news.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      image: products.find((product) => product.image)?.image || "",
      type: "article",
      published: publish,
      sourceProductIds: JSON.stringify(productIds),
    },
    select: { id: true, title: true, slug: true, published: true, createdAt: true },
  });

  return Response.json(
    { ...news, url: `/news/${news.slug}` },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}