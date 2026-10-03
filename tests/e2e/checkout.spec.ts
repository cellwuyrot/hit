import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
const { productId, userToken } = JSON.parse(readFileSync(process.env.E2E_FIXTURE_FILE!, "utf8")) as { productId: string; userToken: string };
const db = new Database(process.env.DATABASE_URL!.replace(/^file:/, ""), { readonly: true });
type OrderRow = { id: string; userId: string | null; total: number; discount: number; subtotal: number; promoCode: string; contactMethod: string; contactDetails: string; deliveryMethod: string; comment: string; email: string };
const getOrder = (id: string) => db.prepare('SELECT * FROM "Order" WHERE "id" = ?').get(id) as OrderRow;
const getPromo = (code: string) => db.prepare('SELECT * FROM "PromoCode" WHERE "code" = ?').get(code) as { active: number };
const userCount = () => (db.prepare('SELECT COUNT(*) AS total FROM "User"').get() as { total: number }).total;
test.afterAll(() => { db.close(); });
async function addGuest(page: Page) {
  await page.goto("/product/e2e-product");
  await page.getByRole("button", { name: "В корзину", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("guestCart") || "[]").length)).toBe(1);
}
async function apply(page: Page, code: string) {
  await page.getByPlaceholder("Введите промокод").fill(code);
  await page.getByRole("button", { name: "Применить", exact: true }).click();
}
async function finish(page: Page, pickup = false, options?: { contactMethod: string; deliveryMethod: string; comment: string }) {
  await page.getByRole("button", { name: "Далее — Данные доставки" }).click();
  await page.getByLabel("Имя получателя *", { exact: true }).fill("Покупатель E2E");
  await page.getByLabel("Телефон *", { exact: true }).fill("+7 999 123 45 67");
  if (pickup) await page.getByLabel("Выбор доставки *", { exact: true }).selectOption("pickup");
  else await page.getByLabel("Адрес доставки *", { exact: true }).fill("Москва, Тестовая улица, дом 1");
  if (options) {
    await page.getByLabel("Выбор доставки *", { exact: true }).selectOption(options.deliveryMethod);
    await page.getByLabel("Предпочитаемый способ связи *", { exact: true }).selectOption(options.contactMethod);
    if (options.contactMethod === "telegram") await page.getByLabel("Telegram: username или ссылка *", { exact: true }).fill("@e2e_contact");
    if (options.contactMethod === "email") await page.getByLabel("Email для связи *", { exact: true }).fill("contact@example.test");
    await page.getByLabel("Комментарий к заказу (необязательно)", { exact: true }).fill(options.comment);
  }
  await page.getByRole("button", { name: "Далее — Подтверждение" }).click();
  if (options) await expect(page.getByText(`Комментарий к заказу: ${options.comment}`, { exact: true })).toBeVisible();
  const response = page.waitForResponse(r => r.url().endsWith("/api/user/orders") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Подтвердить заказ" }).click();
  const r = await response;
  expect(r.status()).toBe(201);
  const order = await r.json();
  await expect(page.getByText("Заказ оформлен!", { exact: true })).toBeVisible();
  await expect(page.getByText(`Номер заказа: #${order.id}`, { exact: true })).toBeVisible();
  return order;
}
test("Гость: товар → localStorage → корзина → заказ, без аккаунта", async ({ page }) => {
  const users = userCount();
  await addGuest(page);
  await page.goto("/cart");
  await expect(page.getByText("E2E товар", { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText("E2E товар", { exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "Оформить заказ" }).click();
  await expect(page.getByRole("button", { name: "Далее — Данные доставки" })).toBeVisible();
  await expect(page.getByText("Зарегистрироваться — по желанию")).toHaveCount(0);
  const order = await finish(page);
  await expect(page.getByRole("link", { name: "Зарегистрироваться — по желанию" })).toBeVisible();
  expect((getOrder(order.id)).userId).toBeNull();
  expect(userCount()).toBe(users);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("guestCart") || "[]"))).toEqual([]);
});
test("Гость: промокод 15%, серверный итог 850 ₽, самовывоз", async ({ page }) => {
  await addGuest(page); await page.goto("/checkout");
  await apply(page, "E2E15");
  await expect(page.getByRole("button", { name: "Убрать «E2E15»" })).toBeVisible();
  await expect(page.getByText("850 ₽", { exact: true })).toBeVisible();
  const order = await finish(page, true);
  const saved = getOrder(order.id);
  expect(saved.total).toBe(850); expect(saved.discount).toBe(150); expect(saved.subtotal).toBe(1000); expect(saved.promoCode).toBe("E2E15");
});
test("Гостевая корзина: изменения количества, промокод и удаление", async ({ page }) => {
  await addGuest(page); await page.goto("/cart");
  await page.getByRole("button", { name: "+", exact: true }).click();
  await expect(page.getByLabel("Количество", { exact: true })).toHaveValue("2");
  await page.getByPlaceholder("Промокод", { exact: true }).fill("E2E15");
  await page.getByRole("button", { name: "Применить", exact: true }).click();
  await expect(page.getByText("1 700 ₽", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "−", exact: true }).click();
  await expect(page.getByText("850 ₽", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "−", exact: true }).click();
  await expect(page.getByText("Корзина пуста", { exact: true })).toBeVisible();
});
test("Авторизованный покупатель: серверная корзина, промокод, заказ в кабинете", async ({ page }) => {
  await page.goto("/account");
  await page.evaluate(token => localStorage.setItem("userToken", token), userToken);
  await page.goto("/product/e2e-product");
  await page.getByRole("button", { name: "В корзину", exact: true }).click();
  await expect(page.getByRole("button", { name: "Добавлено!", exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("guestCart"))).toBeNull();
  await page.goto("/checkout");
  await apply(page, "E2E15");
  await expect(page.getByText("850 ₽", { exact: true })).toBeVisible();
  const order = await finish(page);
  expect((getOrder(order.id)).userId).not.toBeNull();
  await page.getByRole("link", { name: "Мои заказы", exact: true }).click();
  await page.getByRole("button", { name: /^Мои заказы \(/ }).click();
  await expect(page.getByText(`Заказ #${order.id.slice(0, 8)}`, { exact: true })).toBeVisible();
});
test("Неверный и просроченный промокод не применяются", async ({ page }) => {
  await addGuest(page); await page.goto("/checkout");
  await apply(page, "E2E15"); await expect(page.getByText("850 ₽", { exact: true })).toBeVisible();
  await apply(page, "DOESNOTEXIST");
  await expect(page.locator('main [role="alert"]')).toContainText("не найден");
  await expect(page.getByRole("button", { name: /Убрать «/ })).toHaveCount(0);
  await apply(page, "E2EEXPIRED");
  await expect(page.locator('main [role="alert"]')).toContainText("истёк");
  expect(await page.evaluate(() => localStorage.getItem("promoCode"))).toBeNull();
});
test("Лимит использований проверяется и при применении, и при оформлении", async ({ page, request }) => {
  await addGuest(page); await page.goto("/checkout"); await apply(page, "E2EONCE");
  await expect(page.getByText("850 ₽", { exact: true })).toBeVisible();
  await finish(page);
  const response = await request.post("/api/user/orders", { data: { name: "Повтор", phone: "+79991234567", isPickup: true, items: [{ productId, quantity: 1 }], promoCode: "E2EONCE" } });
  expect(response.status()).toBe(400);
  await addGuest(page); await page.goto("/checkout"); await apply(page, "E2EONCE");
  await expect(page.locator('main [role="alert"]')).toContainText("исчерпан");
});
test("Админ: Настройки → Промокоды, создание и отключение; скидка в заказах", async ({ page }) => {
  await page.goto("/admin");
  await page.getByPlaceholder("Логин", { exact: true }).fill("e2e-admin");
  await page.getByPlaceholder("Пароль", { exact: true }).fill("e2e-password");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  const panel = page.getByRole("region", { name: "Промокоды", exact: true });
  await panel.getByLabel("Код промокода", { exact: true }).fill("E2EADMIN");
  await panel.getByLabel("Тип скидки", { exact: true }).selectOption("fixed");
  await panel.getByLabel("Скидка", { exact: true }).fill("150");
  await panel.getByRole("button", { name: "Создать промокод" }).click();
  const row = panel.locator("div.border").filter({ hasText: "E2EADMIN —" });
  await expect(row).toContainText("включён");
  await row.getByRole("button", { name: "Отключить", exact: true }).click();
  await expect(row).toContainText("отключён");
  expect((getPromo("E2EADMIN")).active).toBe(0);
  await page.getByRole("button", { name: /^Заказы \(/ }).click();
  await expect(page.getByText(/Промокод: E2E15 · Скидка:/).first()).toBeVisible();
  await expect(page.getByText(/гостевой заказ/).first()).toBeVisible();
});

test("Админская заметка: сохранение после перезагрузки, изменение, отмена и удаление", async ({ page }) => {
  await page.goto("/admin");
  await page.getByPlaceholder("Логин", { exact: true }).fill("e2e-admin");
  await page.getByPlaceholder("Пароль", { exact: true }).fill("e2e-password");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await page.getByRole("button", { name: /^Заказы \(/ }).click();
  const { id } = db.prepare('SELECT "id" FROM "Order" WHERE "userId" IS NULL ORDER BY "createdAt" DESC LIMIT 1').get() as { id: string };
  const note = page.getByRole("region", { name: `Внутренняя заметка заказа ${id}`, exact: true });
  await note.getByRole("button", { name: "Добавить заметку", exact: true }).click();
  await note.getByLabel("Текст заметки администратора", { exact: true }).fill("Позвонить после 18:00\nУточнить адрес склада");
  await note.getByRole("button", { name: "Сохранить заметку", exact: true }).click();
  await expect(note.getByRole("status")).toHaveText("Заметка сохранена");
  await page.reload();
  await page.getByRole("button", { name: /^Заказы \(/ }).click();
  await expect(note).toContainText("Уточнить адрес склада");
  await note.getByRole("button", { name: "Редактировать заметку", exact: true }).click();
  await note.getByLabel("Текст заметки администратора", { exact: true }).fill("Несохранённое изменение");
  await note.getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(note).toContainText("Уточнить адрес склада");
  await expect(note).not.toContainText("Несохранённое изменение");
  await note.getByRole("button", { name: "Редактировать заметку", exact: true }).click();
  await note.getByLabel("Текст заметки администратора", { exact: true }).fill("Согласовано с покупателем");
  await note.getByRole("button", { name: "Сохранить заметку", exact: true }).click();
  await expect(note).toContainText("Согласовано с покупателем");
  await note.getByRole("button", { name: "Редактировать заметку", exact: true }).click();
  await note.getByLabel("Текст заметки администратора", { exact: true }).fill("");
  await note.getByRole("button", { name: "Сохранить заметку", exact: true }).click();
  await expect(note.getByRole("status")).toHaveText("Заметка удалена");
  await expect(note.getByRole("button", { name: "Добавить заметку", exact: true })).toBeVisible();
  expect((db.prepare('SELECT "adminNote" FROM "Order" WHERE "id" = ?').get(id) as { adminNote: string }).adminNote).toBe("");
});

test("Покупатель не видит внутреннюю заметку в личном кабинете или API", async ({ page, request }) => {
  const { id } = db.prepare('SELECT "id" FROM "Order" WHERE "userId" IS NOT NULL LIMIT 1').get() as { id: string };
  const login = await request.post("/api/admin/auth", { data: { username: "e2e-admin", password: "e2e-password" } });
  const { token } = await login.json();
  const marker = "ВНУТРЕННЯЯ_ЗАМЕТКА_НЕ_ДЛЯ_ПОКУПАТЕЛЯ";
  const save = await request.put("/api/admin/orders", { headers: { Authorization: `Bearer ${token}` }, data: { id, adminNote: marker } });
  expect(save.status()).toBe(200);
  const ownOrders = await request.get("/api/user/orders", { headers: { Authorization: `Bearer ${userToken}` } });
  expect(ownOrders.status()).toBe(200);
  const own = (await ownOrders.json()).find((o: { id: string }) => o.id === id);
  expect(own).toBeTruthy(); expect(own).not.toHaveProperty("adminNote"); expect(JSON.stringify(own)).not.toContain(marker);
  const unauthorized = await request.put("/api/admin/orders", { headers: { Authorization: `Bearer ${userToken}` }, data: { id, adminNote: "Подмена" } });
  expect(unauthorized.status()).toBe(401);
  await page.goto("/account");
  await page.evaluate(token => localStorage.setItem("userToken", token), userToken);
  await page.reload();
  await page.getByRole("button", { name: /^Мои заказы \(/ }).click();
  await expect(page.getByText(`Заказ #${id.slice(0, 8)}`, { exact: true })).toBeVisible();
  await expect(page.getByText(marker, { exact: true })).toHaveCount(0);
  await expect(page.getByText("Заметка администратора", { exact: true })).toHaveCount(0);
});

for (const [deliveryMethod, contactMethod, label] of [
  ["cdek", "telegram", "СДЭК"], ["russian_post", "email", "Почта России"], ["pickup", "whatsapp", "Самовывоз"],
]) {
  test(`Checkout: ${label}, связь ${contactMethod}, комментарий в базе и админке`, async ({ page, request }) => {
    await addGuest(page); await page.goto("/checkout");
    const comment = `Пожелания ${deliveryMethod}\nСвязаться после 18:00`;
    const result = await finish(page, deliveryMethod === "pickup", { deliveryMethod, contactMethod, comment });
    const saved = getOrder(result.id);
    expect(saved.deliveryMethod).toBe(deliveryMethod); expect(saved.contactMethod).toBe(contactMethod); expect(saved.comment).toBe(comment);
    if (contactMethod === "telegram") expect(saved.contactDetails).toBe("@e2e_contact");
    if (contactMethod === "email") expect(saved.email).toBe("contact@example.test");
    const auth = await request.post("/api/admin/auth", { data: { username: "e2e-admin", password: "e2e-password" } });
    const { token } = await auth.json();
    await page.goto("/admin"); await page.evaluate(token => localStorage.setItem("admin_token", token), token); await page.reload();
    await page.getByRole("button", { name: /^Заказы \(/ }).click();
    const card = page.locator('div.p-4.bg-bg-light.rounded-lg').filter({ has: page.getByText(`#${result.id.slice(0, 8)}`, { exact: true }) });
    await expect(card).toContainText(`Доставка: ${label}`); await expect(card).toContainText("Связаться после 18:00");
    await expect(card).toContainText("Предпочитаемый способ связи:");
  });
}
test("Авторизованный checkout: комментарий, телефон, СДЭК показаны в личном кабинете", async ({ page }) => {
  await page.goto("/account"); await page.evaluate(token => localStorage.setItem("userToken", token), userToken);
  await page.goto("/product/e2e-product"); await page.getByRole("button", { name: "В корзину", exact: true }).click();
  await expect(page.getByRole("button", { name: "Добавлено!", exact: true })).toBeVisible();
  await page.goto("/checkout");
  const result = await finish(page, false, { deliveryMethod: "cdek", contactMethod: "phone", comment: "Комментарий авторизованного покупателя" });
  await page.getByRole("link", { name: "Мои заказы", exact: true }).click();
  await page.getByRole("button", { name: /^Мои заказы \(/ }).click();
  const card = page.locator('div.bg-bg-white.rounded-xl.border').filter({ has: page.getByText(`Заказ #${result.id.slice(0, 8)}`, { exact: true }) });
  await expect(card).toContainText("Доставка: СДЭК"); await expect(card).toContainText("Телефон");
  await expect(card).toContainText("Комментарий авторизованного покупателя");
});
test("Checkout блокирует отсутствующий email/Telegram и сохраняет адрес при переключении доставки", async ({ page }) => {
  await addGuest(page); await page.goto("/checkout"); await page.getByRole("button", { name: "Далее — Данные доставки" }).click();
  await page.getByLabel("Имя получателя *", { exact: true }).fill("Тест");
  await page.getByLabel("Телефон *", { exact: true }).fill("+79991234567");
  await page.getByLabel("Адрес доставки *", { exact: true }).fill("Москва, Тестовая улица, дом 1");
  await page.getByLabel("Выбор доставки *", { exact: true }).selectOption("pickup");
  await expect(page.getByLabel("Адрес доставки *", { exact: true })).toHaveCount(0);
  await page.getByLabel("Выбор доставки *", { exact: true }).selectOption("russian_post");
  await expect(page.getByLabel("Адрес доставки *", { exact: true })).toHaveValue("Москва, Тестовая улица, дом 1");
  await page.getByLabel("Предпочитаемый способ связи *", { exact: true }).selectOption("email");
  await page.getByRole("button", { name: "Далее — Подтверждение" }).click();
  await expect(page.locator('main [role="alert"]')).toContainText("Укажите email");
  await page.getByLabel("Предпочитаемый способ связи *", { exact: true }).selectOption("telegram");
  await page.getByRole("button", { name: "Далее — Подтверждение" }).click();
  await expect(page.locator('main [role="alert"]')).toContainText("Укажите Telegram");
});
