import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { sendVerificationCode } from "@/lib/email";

// Ответ одинаков независимо от того, зарегистрирован email или нет,
// чтобы эндпоинт нельзя было использовать для перебора базы пользователей.
const GENERIC_REQUEST_RESPONSE = {
  success: true,
  message: "Если email зарегистрирован, код восстановления отправлен на почту",
};

const CODE_TTL_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  const { action, email, token, newPassword } = await req.json();

  if (action === "request") {
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(GENERIC_REQUEST_RESPONSE);
    }

    // 128 бит энтропии — код нельзя подобрать перебором,
    // поэтому отдельный счётчик попыток не требуется.
    const resetToken = randomUUID().replace(/-/g, "");
    const resetExpires = new Date(Date.now() + CODE_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpires },
    });

    // Код уходит ТОЛЬКО на почту владельца аккаунта.
    // Раньше он возвращался прямо в теле ответа: зная чужой email, кто угодно
    // мог получить код и захватить чужой аккаунт.
    try {
      await sendVerificationCode(user.email, resetToken);
    } catch (error) {
      console.error("Не удалось отправить код восстановления:", error);
      return NextResponse.json(
        { error: "Не удалось отправить письмо. Попробуйте позже." },
        { status: 502 }
      );
    }

    return NextResponse.json(GENERIC_REQUEST_RESPONSE);
  }

  if (action === "reset") {
    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and password required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Пароль должен быть минимум 6 символов" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: String(token),
        resetExpires: { gte: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Неверный или просроченный код восстановления" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetExpires: null },
    });

    return NextResponse.json({ success: true, message: "Пароль успешно изменён" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
