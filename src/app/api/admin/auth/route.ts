import { prisma } from "@/lib/prisma";
import { signToken, verifyToken, getTokenFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return Response.json({ error: "Введите логин и пароль" }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { username } });

  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    return Response.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  const token = signToken({ id: admin.id, username: admin.username, role: "admin" });
  return Response.json({ token, username: admin.username });
}

export async function PUT(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return Response.json({ error: "Не авторизован" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { currentPassword, newPassword, newUsername } = await request.json();

  const admin = await prisma.admin.findUnique({ where: { id: payload.id } });
  if (!admin) return Response.json({ error: "Админ не найден" }, { status: 404 });

  if (newPassword) {
    if (!currentPassword) return Response.json({ error: "Введите текущий пароль" }, { status: 400 });
    if (newPassword.length < 6) return Response.json({ error: "Новый пароль должен быть минимум 6 символов" }, { status: 400 });
    if (!(await bcrypt.compare(currentPassword, admin.password))) {
      return Response.json({ error: "Неверный текущий пароль" }, { status: 400 });
    }
  }

  const data: Record<string, string> = {};
  if (newUsername && newUsername !== admin.username) {
    const existing = await prisma.admin.findUnique({ where: { username: newUsername } });
    if (existing) return Response.json({ error: "Этот логин уже занят" }, { status: 400 });
    data.username = newUsername;
  }
  if (newPassword) {
    data.password = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Нечего обновлять" }, { status: 400 });
  }

  await prisma.admin.update({ where: { id: payload.id }, data });
  const newToken = signToken({ id: admin.id, username: data.username || admin.username, role: "admin" });
  return Response.json({ success: true, token: newToken, username: data.username || admin.username });
}
