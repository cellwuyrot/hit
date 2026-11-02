import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/email";
import { signToken } from "@/lib/auth";
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { action, email, code, password } = await request.json();
    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return Response.json({ error: "Укажите корректный email" }, { status: 400 });
    if (action === "send-code") {
      const recent = await prisma.emailVerification.findFirst({ where: { email, createdAt: { gt: new Date(Date.now() - 60_000) } } });
      if (recent) return Response.json({ error: "Повторная отправка доступна через минуту" }, { status: 429 });
      const verificationCode = randomInt(100000, 1000000).toString();
      await prisma.$transaction(async tx => {
        await tx.emailVerification.deleteMany({ where: { email } });
        await tx.emailVerification.create({ data: { email, code: verificationCode, expiresAt: new Date(Date.now() + 600_000) } });
      });
      await sendVerificationCode(email, verificationCode);
      return Response.json({ success: true, message: "Код отправлен на email" });
    }
    if (action === "verify-code") {
      if (typeof code !== "string" || !/^\d{6}$/.test(code) || typeof password !== "string" || password.length < 6 || password.length > 200)
        return Response.json({ error: "Проверьте код и пароль" }, { status: 400 });
      const hashed = await bcrypt.hash(password, 10);
      const result = await prisma.$transaction(async tx => {
        const verification = await tx.emailVerification.findFirst({ where: { email }, orderBy: { createdAt: "desc" } });
        if (!verification || verification.expiresAt <= new Date() || verification.attempts >= 5) return null;
        if (verification.code !== code) {
          await tx.emailVerification.update({ where: { id: verification.id }, data: { attempts: { increment: 1 } } });
          return null;
        }
        if (await tx.user.findUnique({ where: { email } })) return null;
        const consumed = await tx.emailVerification.deleteMany({ where: { id: verification.id, code, attempts: { lt: 5 }, expiresAt: { gt: new Date() } } });
        if (!consumed.count) return null;
        return tx.user.create({ data: { email, password: hashed } });
      });
      if (!result) return Response.json({ error: "Неверный или просроченный код либо email уже зарегистрирован" }, { status: 400 });
      return Response.json({ token: signToken({ id: result.id, email: result.email, role: "user" }), user: { id: result.id, email: result.email } });
    }
    return Response.json({ error: "Неизвестное действие" }, { status: 400 });
  } catch (err) { console.error("Verification error", err); return Response.json({ error: "Не удалось обработать запрос" }, { status: 500 }); }
}
