import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createCheckoutOrder, quoteCheckout } from "../src/lib/checkout";
import { orderDetailsHtml } from "../src/lib/email";
import { signToken } from "../src/lib/auth";
import { POST as orderPOST, GET as orderGET } from "../src/app/api/user/orders/route";
import { POST as promoPOST } from "../src/app/api/promo/route";
import { POST as adminPOST, GET as adminGET } from "../src/app/api/admin/promo/route";
import { POST as cartPOST } from "../src/app/api/user/cart/route";
import { GET as adminOrdersGET, PUT as adminOrderPUT } from "../src/app/api/admin/orders/route";

const customer = { name: "Тестовый покупатель", phone: "+7 999 123-45-67", address: "Москва, Тестовая улица, дом 1" };
let productId: string;
let userId: string;
let userToken: string;
const adminToken = signToken({ id: "test-admin", role: "admin" });
const items = (quantity = 1, isPack = false) => [{ productId, quantity, isPack }];
const req = (body: unknown, token?: string, method = "POST") => new Request("http://localhost/api/test", { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(method !== "GET" ? { body: JSON.stringify(body) } : {}) });
async function promo(code: string, data: Record<string, unknown> = {}) {
  return prisma.promoCode.create({ data: { code, discountType: "percent", discountValue: 15, ...data } });
}
before(async () => {
  const category = await prisma.category.create({ data: { name: "Тест", slug: "test" } });
  const product = await prisma.product.create({ data: { name: "Тестовый товар", slug: "test-product", price: 1000, inStock: 1000, packSize: 5, categoryId: category.id } });
  productId = product.id;
  const user = await prisma.user.create({ data: { name: "Клиент", email: "customer@example.test", password: "test" } });
  userId = user.id;
  userToken = signToken({ id: user.id, role: "user" });
});
after(async () => { await prisma.$disconnect(); });

test("Гостевой заказ: без регистрации, обязательного email и пользователя", async () => {
  const before = await prisma.user.count();
  const res = await orderPOST(req({ ...customer, items: items() }));
  assert.equal(res.status, 201);
  const response = await res.json();
  assert.ok(response.id);
  const order = await prisma.order.findUniqueOrThrow({ where: { id: response.id } });
  assert.equal(order.userId, null);
  assert.equal(order.total, 1000);
  assert.equal(order.email, "");
  assert.equal(await prisma.user.count(), before);
});
test("Гость: проверка и применение 15%, 1000 → 850; подмена цены и скидки игнорируется", async () => {
  const p = await promo("GUEST15");
  const check = await promoPOST(req({ code: " guest15 ", items: items(), total: 1, discount: 999 }));
  assert.equal(check.status, 200);
  const preview = await check.json();
  assert.equal(preview.subtotal, 1000); assert.equal(preview.discount, 150); assert.equal(preview.total, 850);
  assert.equal((await prisma.promoCode.findUniqueOrThrow({ where: { id: p.id } })).usedCount, 0);
  const order = await createCheckoutOrder(null, { ...customer, items: [{ ...items()[0], price: 1 }], promoCode: "GUEST15", discount: 999, total: 1, userId });
  const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(saved.subtotal, 1000); assert.equal(saved.discount, 150); assert.equal(saved.total, 850); assert.equal(saved.promoCode, "GUEST15"); assert.equal(saved.userId, null);
  assert.equal((await prisma.promoCode.findUniqueOrThrow({ where: { id: p.id } })).usedCount, 1);
});
test("Авторизованный checkout использует только серверную корзину и применяет фиксированную скидку", async () => {
  await promo("USER150", { discountType: "fixed", discountValue: 150 });
  assert.equal((await cartPOST(req({ productId, quantity: 1 }, userToken))).status, 200);
  const preview = await quoteCheckout(userId, [{ productId: "fake", quantity: 100 }], "USER150");
  assert.equal(preview.total, 850);
  const order = await createCheckoutOrder(userId, { ...customer, promoCode: "USER150", items: [] });
  assert.equal(order.userId, userId); assert.equal(order.total, 850); assert.equal(order.email, "customer@example.test");
  assert.equal(await prisma.cartItem.count({ where: { userId } }), 0);
  const list = await orderGET(req(null, userToken, "GET"));
  assert.equal(list.status, 200); assert.ok((await list.json()).some((o: { id: string }) => o.id === order.id));
});
for (const [code, options, message] of [
  ["MISSING", null, /не найден/],
  ["EXPIRED", { expiresAt: new Date("2020-01-01") }, /истёк/],
  ["DISABLED", { active: false }, /отключён/],
  ["FUTURE", { startsAt: new Date("2099-01-01") }, /не начал/],
  ["MINIMUM", { minOrder: 2000 }, /от 2/],
  ["EXHAUSTED", { maxUses: 1, usedCount: 1 }, /исчерпан/],
] as const) {
  test(`Отклонение промокода ${code}: без заказа, списания остатков и использования`, async () => {
    if (options) await promo(code, options);
    const count = await prisma.order.count();
    const stock = (await prisma.product.findUniqueOrThrow({ where: { id: productId } })).inStock;
    await assert.rejects(() => createCheckoutOrder(null, { ...customer, items: items(), promoCode: code }), message);
    const res = await promoPOST(req({ code, items: items() }));
    assert.equal(res.status, 400);
    assert.equal(await prisma.order.count(), count);
    assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).inStock, stock);
  });
}
test("Лимит 1: второй заказ отклоняется", async () => {
  const p = await promo("ONCE", { maxUses: 1 });
  await createCheckoutOrder(null, { ...customer, items: items(), promoCode: p.code });
  await assert.rejects(() => createCheckoutOrder(null, { ...customer, items: items(), promoCode: p.code }), /исчерпан/);
  assert.equal((await prisma.promoCode.findUniqueOrThrow({ where: { id: p.id } })).usedCount, 1);
});
test("Параллельные заказы: последний промокод и остаток не расходуются дважды", async () => {
  const p = await promo("RACE", { maxUses: 1 });
  const before = await prisma.order.count();
  const results = await Promise.allSettled(Array.from({ length: 4 }, () => createCheckoutOrder(null, { ...customer, items: items(), promoCode: p.code })));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(await prisma.order.count(), before + 1);
  assert.equal((await prisma.promoCode.findUniqueOrThrow({ where: { id: p.id } })).usedCount, 1);
  await prisma.product.update({ where: { id: productId }, data: { inStock: 1 } });
  const stockRace = await Promise.allSettled([1, 2].map(() => createCheckoutOrder(null, { ...customer, items: items() })));
  assert.equal(stockRace.filter(r => r.status === "fulfilled").length, 1);
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).inStock, 0);
  await prisma.product.update({ where: { id: productId }, data: { inStock: 1000 } });
});
test("Сбой после резервирования: транзакция откатывает и промокод, и склад", async () => {
  const p = await promo("ROLLBACK");
  const stock = (await prisma.product.findUniqueOrThrow({ where: { id: productId } })).inStock;
  // Ошибка создания OrderItem после списания склада/промокода.
  await prisma.$executeRawUnsafe(`CREATE TRIGGER test_order_failure BEFORE INSERT ON "OrderItem" BEGIN SELECT RAISE(ABORT, 'test failure'); END;`);
  const count = await prisma.order.count();
  try { await assert.rejects(() => createCheckoutOrder(null, { ...customer, items: items(), promoCode: p.code })); }
  finally { await prisma.$executeRawUnsafe("DROP TRIGGER test_order_failure"); }
  assert.equal(await prisma.order.count(), count);
  assert.equal((await prisma.promoCode.findUniqueOrThrow({ where: { id: p.id } })).usedCount, 0);
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).inStock, stock);
});
test("Дубликаты позиций и обычный товар + упаковка проверяются по суммарному остатку", async () => {
  await prisma.product.update({ where: { id: productId }, data: { inStock: 5 } });
  await assert.rejects(() => createCheckoutOrder(null, { ...customer, items: [...items(3), ...items(3)] }), /Недостаточно/);
  await assert.rejects(() => createCheckoutOrder(null, { ...customer, items: [...items(1), ...items(5, true)] }), /Недостаточно/);
  await prisma.product.update({ where: { id: productId }, data: { inStock: 1000 } });
});
test("Поддельная упаковка, отрицательные/дробные количества и обязательные поля", async () => {
  for (const rows of [items(-1), items(0), items(1.5), items(10001), items(1, true)]) await assert.rejects(() => createCheckoutOrder(null, { ...customer, items: rows }));
  for (const fields of [{ name: " " }, { phone: "12" }, { address: "" }, { email: "invalid" }]) await assert.rejects(() => createCheckoutOrder(null, { ...customer, ...fields, items: items() }));
});
test("Самовывоз без адреса и скидка не больше суммы заказа", async () => {
  await promo("FIXBIG", { discountType: "fixed", discountValue: 99999 });
  const order = await createCheckoutOrder(null, { ...customer, address: "", isPickup: true, items: items(5, true), promoCode: "FIXBIG" });
  assert.equal(order.subtotal, 4500); assert.equal(order.total, 0); assert.equal(order.discount, 4500); assert.match(order.address, /Самовывоз/);
});
test("Администратор создаёт, отключает промокод, видит счётчик и гостевой заказ", async () => {
  const data = { code: "ADMINCODE", discountType: "fixed", discountValue: 150, minOrder: 1000, maxUses: 10, active: true, startsAt: "2020-01-01", expiresAt: "2099-01-01" };
  assert.equal((await adminPOST(req(data))).status, 401);
  const created = await adminPOST(req(data, adminToken)); assert.equal(created.status, 200);
  const p = await created.json();
  const order = await createCheckoutOrder(null, { ...customer, items: items(), promoCode: p.code });
  const list = await adminGET(req(null, adminToken, "GET"));
  assert.equal((await list.json()).find((r: { id: string }) => r.id === p.id).usedCount, 1);
  assert.equal((await adminPOST(req({ ...data, id: p.id, active: false, usedCount: 0 }, adminToken))).status, 200);
  await assert.rejects(() => quoteCheckout(null, items(), p.code), /отключён/);
  assert.equal((await prisma.promoCode.findUniqueOrThrow({ where: { id: p.id } })).usedCount, 1);
  const orders = await adminOrdersGET(req(null, adminToken, "GET"));
  const saved = (await orders.json()).find((r: { id: string }) => r.id === order.id);
  assert.equal(saved.user, null); assert.equal(saved.discount, 150); assert.equal(saved.total, 850);
  assert.equal((await adminOrderPUT(req({ id: order.id, status: "processing" }, adminToken, "PUT"))).status, 200);
});
test("Админская валидация промокодов: дубликат, процент >100 и обратный период", async () => {
  const body = { code: "ADMINCODE", discountType: "percent", discountValue: 15 };
  assert.equal((await adminPOST(req(body, adminToken))).status, 409);
  assert.equal((await adminPOST(req({ ...body, code: "BAD", discountValue: 101 }, adminToken))).status, 400);
  assert.equal((await adminPOST(req({ ...body, code: "BAD", startsAt: "2030-01-01", expiresAt: "2020-01-01" }, adminToken))).status, 400);
});
test("Гостю недоступны чужие заказы; плохой токен не превращается в гостя", async () => {
  assert.equal((await orderGET(req(null, undefined, "GET"))).status, 401);
  assert.equal((await orderPOST(req({ ...customer, items: items() }, "invalid"))).status, 401);
});

test("Некорректное тело и пустой/плохой Authorization отклоняются понятной ошибкой", async () => {
  assert.equal((await orderPOST(req(null))).status, 400);
  assert.equal((await orderPOST(req([]))).status, 400);
  const request = req({ ...customer, items: items() });
  request.headers.set("Authorization", "Bearer ");
  assert.equal((await orderPOST(request)).status, 401);
});

test("Миграция сохраняет старые заказы, позиции, сообщения, суммы и поисковый индекс", async () => {
  const { default: Database } = await import("better-sqlite3");
  const { readdirSync, readFileSync } = await import("node:fs");
  const db = new Database(":memory:");
  try {
    const migration = "20261001130000_guest_checkout_promo_starts";
    for (const dir of readdirSync("prisma/migrations").sort()) {
      if (dir !== "migration_lock.toml" && dir < migration) db.exec(readFileSync(`prisma/migrations/${dir}/migration.sql`, "utf8"));
    }
    db.exec(`
      INSERT INTO "User" (id, email, password) VALUES ('old-user', 'old@example.test', 'test');
      INSERT INTO "Category" (id, name, slug) VALUES ('old-cat', 'old category', 'old-cat');
      INSERT INTO "Product" (id, name, slug, price, "categoryId", "updatedAt") VALUES ('old-product', 'old product', 'old-product', 1000, 'old-cat', CURRENT_TIMESTAMP);
      INSERT INTO "Order" (id, "userId", total, discount, "promoCode", "updatedAt") VALUES ('old-order', 'old-user', 850, 150, 'OLD15', CURRENT_TIMESTAMP);
      INSERT INTO "OrderItem" (id, "orderId", "productId", quantity, price) VALUES ('old-item', 'old-order', 'old-product', 1, 1000);
      INSERT INTO "Message" (id, "orderId", "senderId", text) VALUES ('old-message', 'old-order', 'old-user', 'old message');
    `);
    db.exec(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    const order = db.prepare('SELECT * FROM "Order" WHERE id = ?').get("old-order") as { total: number; subtotal: number; discount: number; email: string; userId: string; promoCode: string };
    assert.equal(order.total, 850); assert.equal(order.subtotal, 1000); assert.equal(order.discount, 150); assert.equal(order.email, "old@example.test"); assert.equal(order.userId, "old-user"); assert.equal(order.promoCode, "OLD15");
    assert.ok(db.prepare('SELECT * FROM "OrderItem" WHERE id = ?').get("old-item"));
    assert.ok(db.prepare('SELECT * FROM "Message" WHERE id = ?').get("old-message"));
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
    assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name = 'product_fts'").get());
    // New additive note migration preserves all existing data and private defaults.
    db.exec(readFileSync("prisma/migrations/20261001160000_order_admin_note/migration.sql", "utf8"));
    const migrated = db.prepare('SELECT "adminNote", "total", "discount", "userId" FROM "Order" WHERE "id" = ?').get("old-order") as { adminNote: string; total: number; discount: number; userId: string };
    assert.equal(migrated.adminNote, ""); assert.equal(migrated.total, 850); assert.equal(migrated.discount, 150); assert.equal(migrated.userId, "old-user");
    db.exec(`UPDATE "Order" SET "adminNote" = 'Legacy private note', "comment" = 'Legacy customer comment' WHERE "id" = 'old-order';
      INSERT INTO "Order" ("id", "total", "address", "updatedAt") VALUES ('old-pickup', 100, 'Самовывоз: Москва, склад', CURRENT_TIMESTAMP);`);
    db.exec(readFileSync("prisma/migrations/20261002150000_order_contact_delivery/migration.sql", "utf8"));
    const options = db.prepare('SELECT * FROM "Order" WHERE "id" = ?').get("old-order") as { contactMethod: string; deliveryMethod: string; adminNote: string; comment: string; total: number };
    assert.equal(options.contactMethod, "phone"); assert.equal(options.deliveryMethod, ""); assert.equal(options.adminNote, "Legacy private note"); assert.equal(options.comment, "Legacy customer comment"); assert.equal(options.total, 850);
    assert.equal((db.prepare('SELECT "deliveryMethod" FROM "Order" WHERE "id" = ?').get("old-pickup") as { deliveryMethod: string }).deliveryMethod, "pickup");

    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);

  } finally { db.close(); }
});

test("Внутренняя заметка: создание, изменение, очистка; комментарий покупателя не изменяется", async () => {
  const order = await createCheckoutOrder(null, { ...customer, items: items(), comment: "Позвонить перед доставкой" });
  assert.equal(order.adminNote, "");
  for (const [input, expected] of [["Перезвонить завтра\nУточнить склад", "Перезвонить завтра\nУточнить склад"], ["  Новый текст  ", "Новый текст"], ["", ""]]) {
    const res = await adminOrderPUT(req({ id: order.id, adminNote: input }, adminToken, "PUT"));
    assert.equal(res.status, 200);
    assert.equal((await res.json()).adminNote, expected);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(saved.adminNote, expected); assert.equal(saved.comment, "Позвонить перед доставкой"); assert.equal(saved.total, order.total); assert.equal(saved.status, order.status);
    const adminList = await adminOrdersGET(req(null, adminToken, "GET"));
    assert.equal((await adminList.json()).find((o: { id: string }) => o.id === order.id).adminNote, expected);
  }
});
test("Гость и покупатель не могут читать или менять заметки через административный API", async () => {
  const order = await createCheckoutOrder(null, { ...customer, items: items() });
  await adminOrderPUT(req({ id: order.id, adminNote: "Внутренние данные" }, adminToken, "PUT"));
  for (const token of [undefined, userToken, "invalid"]) {
    assert.equal((await adminOrdersGET(req(null, token, "GET"))).status, 401);
    assert.equal((await adminOrderPUT(req({ id: order.id, adminNote: "Подмена" }, token, "PUT"))).status, 401);
  }
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).adminNote, "Внутренние данные");
});
test("Личный кабинет/API заказа не возвращает приватную заметку, даже владельцу заказа", async () => {
  await cartPOST(req({ productId, quantity: 1 }, userToken));
  const order = await createCheckoutOrder(userId, { ...customer, comment: "Видимый комментарий", adminNote: "Нельзя задать из checkout" });
  assert.equal(order.adminNote, "");
  await adminOrderPUT(req({ id: order.id, adminNote: "SECRET_ONLY_FOR_ADMIN" }, adminToken, "PUT"));
  const res = await orderGET(req(null, userToken, "GET"));
  const data = await res.json();
  const own = data.find((o: { id: string }) => o.id === order.id);
  assert.ok(own); assert.equal(own.comment, "Видимый комментарий");
  assert.equal(Object.hasOwn(own, "adminNote"), false);
  assert.equal(JSON.stringify(data).includes("SECRET_ONLY_FOR_ADMIN"), false);
  const guest = await orderPOST(req({ ...customer, items: items(), adminNote: "Подмена гостем" }));
  assert.equal(guest.status, 201);
  const result = await guest.json();
  assert.equal(Object.hasOwn(result, "adminNote"), false);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: result.id } })).adminNote, "");
});
test("Валидация заметки: строка до 5000 символов, понятная ошибка для несуществующего заказа", async () => {
  const order = await createCheckoutOrder(null, { ...customer, items: items() });
  for (const input of [null, 123, { text: "bad" }, "x".repeat(5001)]) {
    assert.equal((await adminOrderPUT(req({ id: order.id, adminNote: input }, adminToken, "PUT"))).status, 400);
  }
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).adminNote, "");
  assert.equal((await adminOrderPUT(req({ id: order.id, adminNote: "x".repeat(5000) }, adminToken, "PUT"))).status, 200);
  assert.equal((await adminOrderPUT(req({ id: "not-found", adminNote: "note" }, adminToken, "PUT"))).status, 404);
  assert.equal((await adminOrderPUT(req(null, adminToken, "PUT"))).status, 400);
});
test("Изменение статуса и трека не стирает внутреннюю заметку", async () => {
  const order = await createCheckoutOrder(null, { ...customer, items: items() });
  await adminOrderPUT(req({ id: order.id, adminNote: "Уточнили детали" }, adminToken, "PUT"));
  assert.equal((await adminOrderPUT(req({ id: order.id, status: "processing", trackNumber: "TEST-TRACK", trackUrl: "https://example.test/track" }, adminToken, "PUT"))).status, 200);
  const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(saved.adminNote, "Уточнили детали"); assert.equal(saved.status, "processing"); assert.equal(saved.trackNumber, "TEST-TRACK");
});

for (const contactMethod of ["phone", "telegram", "whatsapp", "email"]) {
  for (const deliveryMethod of ["cdek", "russian_post", "pickup"]) {
    test(`Гость: связь ${contactMethod}, доставка ${deliveryMethod}, многострочный комментарий`, async () => {
      const order = await createCheckoutOrder(null, { ...customer, items: items(), contactMethod, deliveryMethod,
        email: contactMethod === "email" ? "guest@example.test" : "", contactDetails: "https://t.me/guest_contact",
        address: deliveryMethod === "pickup" ? "" : customer.address, comment: "Не звонить утром\nУпаковать аккуратно" });
      assert.equal(order.contactMethod, contactMethod); assert.equal(order.deliveryMethod, deliveryMethod);
      assert.equal(order.contactDetails, contactMethod === "telegram" ? "@guest_contact" : "");
      assert.equal(order.comment, "Не звонить утром\nУпаковать аккуратно"); assert.equal(order.adminNote, ""); assert.equal(order.total, 1000);
      if (deliveryMethod === "pickup") assert.match(order.address, /^Самовывоз:/);
      const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
      assert.equal(saved.deliveryMethod, deliveryMethod); assert.equal(saved.contactMethod, contactMethod);
      const list = await adminOrdersGET(req(null, adminToken, "GET"));
      assert.equal((await list.json()).find((o: { id: string }) => o.id === order.id).comment, order.comment);
    });
  }
}
for (const contactMethod of ["phone", "telegram", "whatsapp", "email"]) {
  test(`Авторизованный покупатель: связь ${contactMethod}, Почта России, комментарий и скидка`, async () => {
    await cartPOST(req({ productId, quantity: 1 }, userToken));
    const order = await createCheckoutOrder(userId, { ...customer, contactMethod, deliveryMethod: "russian_post", contactDetails: "@user_contact", comment: "Упаковать отдельно", promoCode: "USER150" });
    assert.equal(order.total, 850); assert.equal(order.contactMethod, contactMethod); assert.equal(order.email, "customer@example.test");
    const list = await orderGET(req(null, userToken, "GET"));
    const own = (await list.json()).find((o: { id: string }) => o.id === order.id);
    assert.equal(own.deliveryMethod, "russian_post"); assert.equal(own.comment, "Упаковать отдельно"); assert.equal(Object.hasOwn(own, "adminNote"), false);
  });
}
test("Неизвестные способы, пустая почта/Telegram и конфликт самовывоза отклоняются без заказа", async () => {
  const count = await prisma.order.count();
  const stock = (await prisma.product.findUniqueOrThrow({ where: { id: productId } })).inStock;
  for (const invalid of [
    { contactMethod: "sms" }, { contactMethod: null }, { deliveryMethod: "courier" }, { deliveryMethod: null },
    { contactMethod: "email", email: "" }, { contactMethod: "email", email: "broken" },
    { contactMethod: "telegram", contactDetails: "" }, { contactMethod: "telegram", contactDetails: "https://evil.test/user" },
    { deliveryMethod: "cdek", isPickup: true }, { deliveryMethod: "pickup", isPickup: false },
    { deliveryMethod: "cdek", address: "" }, { deliveryMethod: "russian_post", address: "short" },
  ]) {
    await assert.rejects(() => createCheckoutOrder(null, { ...customer, items: items(), ...invalid }));
    const res = await orderPOST(req({ ...customer, items: items(), ...invalid })); assert.equal(res.status, 400);
  }
  assert.equal(await prisma.order.count(), count); assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).inStock, stock);
});
test("Комментарий необязателен, лимит 2000 символов, внутреннюю заметку клиент не задаёт", async () => {
  const max = await createCheckoutOrder(null, { ...customer, items: items(), comment: "x".repeat(2000) }); assert.equal(max.comment.length, 2000);
  for (const comment of ["x".repeat(2001), { text: "bad" }, 123]) await assert.rejects(() => createCheckoutOrder(null, { ...customer, items: items(), comment }));
  const empty = await createCheckoutOrder(null, { ...customer, items: items(), comment: " ", adminNote: "Подмена" }); assert.equal(empty.comment, ""); assert.equal(empty.adminNote, "");
});
test("Совместимость старого isPickup и очистка неактивного Telegram-контакта", async () => {
  const legacy = await createCheckoutOrder(null, { ...customer, address: "", items: items(), isPickup: true });
  assert.equal(legacy.deliveryMethod, "pickup"); assert.equal(legacy.contactMethod, "phone");
  const current = await createCheckoutOrder(null, { ...customer, items: items(), contactMethod: "phone", contactDetails: "@old_telegram" }); assert.equal(current.contactDetails, "");
});
test("Шаблон письма содержит доставку, связь и безопасный комментарий, но не adminNote", async () => {
  const order = await createCheckoutOrder(null, { ...customer, items: items(), deliveryMethod: "russian_post", contactMethod: "telegram", contactDetails: "@test_user", comment: "<img src=x onerror=alert(1)>\nВторая строка" });
  const html = orderDetailsHtml({ ...order, adminNote: "PRIVATE_NOT_IN_EMAIL" } as typeof order);
  assert.match(html, /Почта России/); assert.match(html, /Telegram/); assert.match(html, /@test_user/); assert.match(html, /&lt;img/); assert.ok(!html.includes("<img src=x")); assert.ok(!html.includes("PRIVATE_NOT_IN_EMAIL"));
});
