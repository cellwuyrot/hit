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

  const clients = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      lastName: true,
      phone: true,
      city: true,
      createdAt: true,
      _count: { select: { orders: true, reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = clients.map((c) => ({
    id: c.id,
    email: c.email,
    name: c.name,
    lastName: c.lastName,
    phone: c.phone,
    city: c.city,
    createdAt: c.createdAt,
    ordersCount: c._count.orders,
    reviewsCount: c._count.reviews,
  }));

  return Response.json(result);
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return Response.json({ error: "ID обязателен" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return Response.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action } = await req.json();
  if (!id) return Response.json({ error: "ID обязателен" }, { status: 400 });

  if (action === "get-details") {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, lastName: true, phone: true,
        zipCode: true, region: true, city: true, street: true, building: true, apartment: true,
        createdAt: true,
        orders: {
          select: { id: true, status: true, total: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        reviews: {
          select: { id: true, rating: true, text: true, createdAt: true, product: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    return Response.json(user);
  }

  return Response.json({ error: "Неизвестное действие" }, { status: 400 });
}
