import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

// Единая форма: роль определяется только на сервере. При совпадении логинов
// успешные данные администратора имеют приоритет, как и в прежней форме.
export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();
    if (typeof identifier !== "string" || !identifier.trim() || identifier.length > 254 || typeof password !== "string" || !password || password.length > 200)
      return Response.json({ error: "Введите логин и пароль" }, { status: 400 });
    const key = identifier.trim();
    const admin = await prisma.admin.findUnique({ where: { username: key } });
    if (admin && await bcrypt.compare(password, admin.password))
      return Response.json({ role: "admin", token: signToken({ id: admin.id, username: admin.username, role: "admin" }) });
    const user = await prisma.user.findUnique({ where: { email: key } });
    if (user && await bcrypt.compare(password, user.password))
      return Response.json({ role: "user", token: signToken({ id: user.id, email: user.email, role: "user" }), user: { id: user.id, email: user.email, name: user.name } });
    return Response.json({ error: "Неверный логин или пароль" }, { status: 401 });
  } catch (error) { console.error("Login failed", error); return Response.json({ error: "Не удалось войти" }, { status: 500 }); }
}
