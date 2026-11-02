import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { signToken } from "../src/lib/auth";
import { POST as importPOST, PUT as importUpload } from "../src/app/api/admin/import/route";
import { DELETE as categoryDELETE, PUT as categoryPUT } from "../src/app/api/admin/categories/route";
import { DELETE as productDELETE, PUT as productPUT } from "../src/app/api/admin/products/route";
import { DELETE as clientDELETE } from "../src/app/api/admin/clients/route";
import { POST as register } from "../src/app/api/user/auth/route";
import { POST as verify } from "../src/app/api/user/verify/route";
import { POST as login } from "../src/app/api/auth/route";
import { createCheckoutOrder } from "../src/lib/checkout";

const token = signToken({ id: "review-admin", role: "admin" });
const req = (data: unknown, method = "POST", auth = true) => new Request("http://localhost/api/test", { method, headers: { "Content-Type": "application/json", ...(auth ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(data) });
let categoryId: string, productId: string, userId: string;
before(async () => {
  const c = await prisma.category.create({ data: { name: "Кофе", slug: "coffee" } }); categoryId = c.id;
  const p = await prisma.product.create({ data: { name: "Товар", slug: "old-product", price: 100, inStock: 7, categoryId, code: "SKU1", packSize: 4, tags: "тест", isWholesale: true, isImported: true, expirationDate: "2027" } }); productId = p.id;
  const u = await prisma.user.create({ data: { email: "buyer@example.test", password: await bcrypt.hash("password", 10) } }); userId = u.id;
  await prisma.admin.create({ data: { username: "staff", password: await bcrypt.hash("secret-password", 10) } });
});
after(async () => { await prisma.$disconnect(); });
test("Общая форма направляет роли и не принимает неверный пароль", async () => {
  for (const [identifier, password, role] of [["staff", "secret-password", "admin"], ["buyer@example.test", "password", "user"]]) {
    const r = await login(req({ identifier, password }, "POST", false)); assert.equal(r.status, 200); assert.equal((await r.json()).role, role);
  }
  assert.equal((await login(req({ identifier: "staff", password: "wrong" }, "POST", false))).status, 401);
});
test("Регистрация с поддельным verified запрещена; настоящий одноразовый код создаёт учётную запись", async () => {
  const email = "new@example.test";
  assert.equal((await register(req({ action: "register", email, password: "pass123", verified: true }, "POST", false))).status, 400);
  assert.equal(await prisma.user.findUnique({ where: { email } }), null);
  await prisma.emailVerification.create({ data: { email, code: "123456", expiresAt: new Date(Date.now() + 60000) } });
  assert.equal((await verify(req({ action: "verify-code", email, password: "pass123", code: "111111" }, "POST", false))).status, 400);
  const result = await verify(req({ action: "verify-code", email, password: "pass123", code: "123456" }, "POST", false));
  assert.equal(result.status, 200); assert.ok((await result.json()).token); assert.ok(await prisma.user.findUnique({ where: { email } }));
  assert.equal((await verify(req({ action: "verify-code", email, password: "pass123", code: "123456" }, "POST", false))).status, 400);
});
test("После пяти ошибок код блокируется", async () => {
  const email = "locked@example.test"; await prisma.emailVerification.create({ data: { email, code: "222222", expiresAt: new Date(Date.now() + 60000) } });
  for (let i=0; i<5; i++) assert.equal((await verify(req({ action: "verify-code", email, password: "pass123", code: "111111" }, "POST", false))).status, 400);
  assert.equal((await verify(req({ action: "verify-code", email, password: "pass123", code: "222222" }, "POST", false))).status, 400);
});
test("Непустая категория и товар защищены от удаления; переименование сохраняет URL", async () => {
  assert.equal((await categoryDELETE(req({ id: categoryId }, "DELETE"))).status, 409);
  assert.equal((await productDELETE(req({ id: productId }, "DELETE"))).status, 409);
  assert.equal((await categoryPUT(req({ id: categoryId, name: "Напитки", parentId: null }, "PUT"))).status, 200);
  assert.equal((await prisma.category.findUniqueOrThrow({ where: { id: categoryId } })).slug, "coffee");
  assert.ok(await prisma.product.findUnique({ where: { id: productId } }));
});
test("Популярный товар не сбрасывает упаковку, теги, опт и импорт", async () => {
  assert.equal((await productPUT(req({ id: productId, featuredOnly: true, isFeatured: true }, "PUT"))).status, 200);
  const p = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  assert.equal(p.packSize, 4); assert.equal(p.tags, "тест"); assert.equal(p.isWholesale, true); assert.equal(p.isImported, true); assert.equal(p.expirationDate, "2027");
});
test("Импорт без остатка сохраняет остаток; неизвестная категория отменяет все строки", async () => {
  let r = await importPOST(req({ products: [{ name: "Товар", code: "SKU1", price: "120" }] }));
  assert.equal(r.status, 200); assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).inStock, 7);
  r = await importPOST(req({ products: [{ name: "Новый товар", price: 50, categoryId }, { name: "Второй", price: 40, category: "Несуществующая" }] }));
  assert.equal(r.status, 400); assert.equal(await prisma.product.findFirst({ where: { name: "Новый товар" } }), null);
  r = await importPOST(req({ products: [{ name: "Новый товар", price: 50, category: "Несуществующая", categoryId, brand: "Бренд", productType: "Группа" }] }));
  assert.equal(r.status, 200); const p = await prisma.product.findFirstOrThrow({ where: { name: "Новый товар" } }); assert.equal(p.categoryId, categoryId); assert.equal(p.brand, "Бренд"); assert.equal(p.productType, "Группа");
});
test("CSV с названием и ценой, но без категории и бренда, доступен для сопоставления", async () => {
  const data = new FormData(); data.append("file", new File(["Название,Цена\\nТовар без категории,100\\n".replace(/\\n/g, "\n")], "goods.csv", { type: "text/csv" }));
  const r = await importUpload(new Request("http://localhost/api/admin/import", { method: "PUT", headers: { authorization: `Bearer ${token}` }, body: data }));
  assert.equal(r.status, 200); const response = await r.json(); assert.equal(response.rows.length, 1); assert.equal(response.autoMap["Название"], "name"); assert.equal(response.autoMap["Цена"], "price");
});
test("Повтор с ключом возвращает тот же заказ без двойного списания; клиент с заказом не удаляется", async () => {
  const before = (await prisma.product.findUniqueOrThrow({ where: { id: productId } })).inStock;
  const body = { name: "Клиент", phone: "+7 999 123-45-67", address: "Москва, тестовая улица, дом 1", items: [{ productId, quantity: 2 }] };
  const key = "d6b19989-2273-4e96-aec3-dd7f12ccf54d";
  const first = await createCheckoutOrder(null, body, key); const again = await createCheckoutOrder(null, body, key);
  assert.equal(first.id, again.id); assert.equal(again.replayed, true); assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).inStock, before - 2);
  await prisma.order.create({ data: { userId, total: 1 } });
  assert.equal((await clientDELETE(new NextRequest(req({ id: userId }, "DELETE")))).status, 409); assert.ok(await prisma.user.findUnique({ where: { id: userId } }));
});
