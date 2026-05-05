import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const { action, email, token, newPassword } = await req.json();

  if (action === "request") {
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: true, message: "Если email зарегистрирован, инструкция отправлена" });
    }

    const resetToken = randomUUID().replace(/-/g, "");
    const resetExpires = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpires },
    });

    // In production, send email with reset link
    // For now, return the token (in production this would be sent via email)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return NextResponse.json({
      success: true,
      message: "Код восстановления сгенерирован. Введите его ниже.",
      // In dev mode, return token; remove in production
      resetToken,
    });
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
        resetToken: token,
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
