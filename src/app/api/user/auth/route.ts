import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { action, email, password, verified } = await request.json();

  if (action === "register") {
    if (!email || !password) {
      return Response.json({ error: "Введите email и пароль" }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: "Пароль должен быть минимум 6 символов" }, { status: 400 });
    }
    if (!verified) {
      return Response.json({ error: "Подтвердите email" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "Пользователь с таким email уже существует" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed } });
    const token = signToken({ id: user.id, email: user.email, role: "user" });
    return Response.json({ token, user: { id: user.id, email: user.email } });
  }

  if (action === "login") {
    if (!email || !password) {
      return Response.json({ error: "Введите email и пароль" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return Response.json({ error: "Неверный email или пароль" }, { status: 401 });
    }
    const token = signToken({ id: user.id, email: user.email, role: "user" });
    return Response.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  }

  return Response.json({ error: "Неизвестное действие" }, { status: 400 });
}
