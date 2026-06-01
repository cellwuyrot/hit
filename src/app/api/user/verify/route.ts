import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/email";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { action, email, code, password } = await request.json();

    if (action === "send-code") {
      if (!email || !email.includes("@")) {
        return Response.json({ error: "Укажите корректный email" }, { status: 400 });
      }

      const verificationCode = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.emailVerification.deleteMany({ where: { email } });
      await prisma.emailVerification.create({
        data: { email, code: verificationCode, expiresAt },
      });

      await sendVerificationCode(email, verificationCode);
      return Response.json({ success: true, message: "Код отправлен на email" });
    }

    if (action === "verify-code") {
      if (!email || !code) {
        return Response.json({ error: "Укажите email и код" }, { status: 400 });
      }

      const verification = await prisma.emailVerification.findFirst({
        where: { email, code },
        orderBy: { createdAt: "desc" },
      });

      if (!verification) {
        return Response.json({ error: "Неверный код подтверждения" }, { status: 400 });
      }

      if (new Date() > verification.expiresAt) {
        await prisma.emailVerification.delete({ where: { id: verification.id } });
        return Response.json({ error: "Код истёк, запросите новый" }, { status: 400 });
      }

      await prisma.emailVerification.deleteMany({ where: { email } });

      if (!password || password.length < 6) {
        return Response.json({ error: "Пароль должен быть минимум 6 символов" }, { status: 400 });
      }

      return Response.json({ verified: true });
    }

    return Response.json({ error: "Неизвестное действие" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка сервера";
    return Response.json({ error: message }, { status: 500 });
  }
}
