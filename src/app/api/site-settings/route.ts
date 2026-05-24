import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, string> = {
  "header-hours": "ПН-ПТ 09:00–18:00",
  "header-weekend": "СБ-ВС: Выходной",
  "header-region": "Москва и МО",
  "header-subtitle": "интернет-магазин",
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
    "Информация на сайте не является публичной офертой. Изображения товаров могут отличаться от фактического вида. Все цены указаны в рублях и включают НДС.",
};

export async function GET() {
  const existing = await prisma.sitePage.findMany({
    where: { slug: { startsWith: "header-" } },
  });
  const existingFooter = await prisma.sitePage.findMany({
    where: { slug: { startsWith: "footer-" } },
  });

  const all = [...existing, ...existingFooter];
  const allSlugs = new Set(all.map((p) => p.slug));

  const toCreate = Object.entries(DEFAULTS).filter(
    ([slug]) => !allSlugs.has(slug)
  );
  if (toCreate.length > 0) {
    for (const [slug, value] of toCreate) {
      const created = await prisma.sitePage.create({
        data: { slug, title: slug, content: value },
      });
      all.push(created);
    }
  }

  const result: Record<string, { id: string; value: string }> = {};
  for (const entry of all) {
    result[entry.slug] = { id: entry.id, value: entry.content };
  }
  return Response.json(result);
}
