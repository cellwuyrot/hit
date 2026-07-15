import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

const DEFAULTS: Record<string, string> = {
  "header-hours": "ПН-ПТ 09:00–18:00",
  "header-weekend": "СБ-ВС: Выходной",
  "header-region": "Москва и МО",
  "header-subtitle": "интернет-магазин",
  "home-benefit-1-title": "Бесплатная доставка",
  "home-benefit-1-desc": "При заказе от 5 000 ₽",
  "home-benefit-2-title": "Гарантия качества",
  "home-benefit-2-desc": "Проверенные поставщики, документы на товар",
  "home-benefit-3-title": "Быстрая поддержка",
  "home-benefit-3-desc": "Ответим в рабочее время: ПН-ПТ с 09:00 до 18:00",
  "home-benefit-4-title": "Возврат 14 дней",
  "home-benefit-4-desc": "Согласно закону «О защите прав потребителей»",
  "footer-description":
    "Динамично развивающаяся торговая компания с широким ассортиментом товаров для повседневной жизни, бизнеса и семьи.",
  "footer-phone": "+7 (936) 256-89-50",
  "footer-email-1": "zakaz@tophitt.ru",
  "footer-email-2": "opt@tophitt.ru (опт)",
  "footer-email-3": "info@tophitt.ru (поставщики)",
  "footer-address": "127018, г. Москва, ул. Складочная д. 1 стр. 18",
  "footer-hours": "ПН-ПТ с 09:00 до 18:00",
  "footer-catalog-title": "Каталог",
  "footer-info-title": "Информация",
  "footer-contacts-title": "Контакты",
  "footer-social-title": "Наши соцсети",
  "footer-copyright": "ТОПХИТ. Все права защищены.",
  "footer-legal-1": "ИП Атаманова Н.О. ИНН 720302151142, ОГРНИП 323508100551579",
  "footer-legal-2": "Юридический адрес: 127018, г. Москва, ул. Складочная д. 1 стр. 18",
  "footer-disclaimer":
    "Изображения товаров могут отличаться от фактического вида. Все цены указаны в рублях. Условия оплаты, доставки и возврата описаны в соответствующих разделах сайта.",
};

// Устаревшие формулировки, которые автоматически заменяются на новые.
// Замена выполняется только если значение в БД в точности совпадает со старым
// значением по умолчанию (то есть администратор его не редактировал).
const LEGACY_VALUES: Record<string, { from: string; to: string }> = {
  "footer-disclaimer": {
    from: "Информация на сайте не является публичной офертой. Изображения товаров могут отличаться от фактического вида. Все цены указаны в рублях и включают НДС.",
    to: DEFAULTS["footer-disclaimer"],
  },
};

const SETTING_PREFIXES = ["header-", "footer-", "home-benefit-"];

export async function GET() {
  const all = await prisma.sitePage.findMany({
    where: { OR: SETTING_PREFIXES.map((p) => ({ slug: { startsWith: p } })) },
  });
  const bySlug = new Map(all.map((p) => [p.slug, p]));

  // Создаём отсутствующие настройки со значениями по умолчанию
  for (const [slug, value] of Object.entries(DEFAULTS)) {
    if (!bySlug.has(slug)) {
      const created = await prisma.sitePage.create({
        data: { slug, title: slug, content: value },
      });
      bySlug.set(slug, created);
    }
  }

  // Обновляем устаревшие формулировки по умолчанию
  for (const [slug, { from, to }] of Object.entries(LEGACY_VALUES)) {
    const entry = bySlug.get(slug);
    if (entry && entry.content === from) {
      const updated = await prisma.sitePage.update({
        where: { id: entry.id },
        data: { content: to },
      });
      bySlug.set(slug, updated);
    }
  }

  const result: Record<string, { id: string; value: string }> = {};
  for (const entry of bySlug.values()) {
    result[entry.slug] = { id: entry.id, value: entry.content };
  }
  return Response.json(result);
}

export async function PUT(request: Request) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "admin") {
    return Response.json({ error: "Нет доступа" }, { status: 401 });
  }

  const body = (await request.json()) as { values?: Record<string, string> };
  if (!body.values || typeof body.values !== "object") {
    return Response.json({ error: "Поле values обязательно" }, { status: 400 });
  }

  const entries = Object.entries(body.values).filter(
    ([slug, value]) =>
      typeof value === "string" &&
      SETTING_PREFIXES.some((p) => slug.startsWith(p))
  );

  for (const [slug, value] of entries) {
    await prisma.sitePage.upsert({
      where: { slug },
      update: { content: value },
      create: { slug, title: slug, content: value },
    });
  }

  return Response.json({ success: true, updated: entries.length });
}
