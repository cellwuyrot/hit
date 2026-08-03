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

  const synonyms = await prisma.searchSynonym.findMany({
    orderBy: { createdAt: "desc" },
  });
  return Response.json(synonyms);
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { word, synonym } = body;

  if (!word?.trim() || !synonym?.trim()) {
    return Response.json({ error: "Слово и синоним обязательны" }, { status: 400 });
  }

  const created = await prisma.searchSynonym.create({
    data: {
      word: word.trim().toLowerCase(),
      synonym: synonym.trim().toLowerCase(),
    },
  });

  return Response.json(created);
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return Response.json({ error: "ID обязателен" }, { status: 400 });

  await prisma.searchSynonym.delete({ where: { id } });
  return Response.json({ ok: true });
}
