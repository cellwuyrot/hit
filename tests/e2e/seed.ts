import { prisma } from "../../src/lib/prisma";
import { signToken } from "../../src/lib/auth";
import bcrypt from "bcryptjs";
import { writeFileSync } from "node:fs";
async function main() {

  const c = await prisma.category.create({ data: { name: "E2E", slug: "e2e" } });
  const p = await prisma.product.create({ data: { name: "E2E товар", slug: "e2e-product", price: 1000, inStock: 100, packSize: 5, categoryId: c.id } });
  const productId = p.id;
  const user = await prisma.user.create({ data: { email: "e2e@example.test", name: "E2E клиент", phone: "+7 999 123 45 67", address: "Москва, Тестовая улица, дом 1", password: await bcrypt.hash("test-password", 10) } });
  const userToken = signToken({ id: user.id, role: "user" });
  await prisma.admin.create({ data: { username: "e2e-admin", password: await bcrypt.hash("e2e-password", 10) } });
  for (const data of [
    { code: "E2E15", discountValue: 15 },
    { code: "E2EEXPIRED", discountValue: 15, expiresAt: new Date("2020-01-01") },
    { code: "E2EONCE", discountValue: 15, maxUses: 1 },
  ]) await prisma.promoCode.create({ data });

  writeFileSync(process.env.E2E_FIXTURE_FILE!, JSON.stringify({ productId, userToken }));
}
main().finally(() => prisma.$disconnect());
