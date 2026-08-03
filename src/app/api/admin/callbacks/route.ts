import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/auth";

// Единая проверка: валидный токен И роль admin.
// Раньше здесь дублировалась локальная логика, которая проверяла только подпись,
// из-за чего токен обычного покупателя открывал админские данные.
function checkAdmin(req: NextRequest) {
  return isAdminRequest(req);
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const callbacks = await prisma.callbackRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return Response.json(callbacks);
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status } = await req.json();
  const updated = await prisma.callbackRequest.update({
    where: { id },
    data: { status },
  });
  return Response.json(updated);
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.callbackRequest.delete({ where: { id } });
  return Response.json({ success: true });
}
