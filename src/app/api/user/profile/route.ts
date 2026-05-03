import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return Response.json({ error: "Не авторизован" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "user") return Response.json({ error: "Не авторизован" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true, lastName: true, phone: true, address: true, createdAt: true },
  });
  if (!user) return Response.json({ error: "Пользователь не найден" }, { status: 404 });
  return Response.json(user);
}

export async function PUT(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return Response.json({ error: "Не авторизован" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "user") return Response.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const { name, lastName, phone, address, email, currentPassword, newPassword } = body;

  const data: Record<string, string> = {};
  if (name !== undefined) data.name = name;
  if (lastName !== undefined) data.lastName = lastName;
  if (phone !== undefined) data.phone = phone;
  if (address !== undefined) data.address = address;

  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== payload.id) {
      return Response.json({ error: "Этот email уже занят" }, { status: 400 });
    }
    data.email = email;
  }

  if (newPassword) {
    if (!currentPassword) {
      return Response.json({ error: "Введите текущий пароль" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return Response.json({ error: "Новый пароль должен быть минимум 6 символов" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return Response.json({ error: "Неверный текущий пароль" }, { status: 400 });
    }
    data.password = await bcrypt.hash(newPassword, 10);
  }

  const user = await prisma.user.update({
    where: { id: payload.id },
    data,
    select: { id: true, email: true, name: true, lastName: true, phone: true, address: true },
  });
  return Response.json(user);
}
