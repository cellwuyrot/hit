import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
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
