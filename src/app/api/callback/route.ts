import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, phone } = await request.json();

    if (!name || !name.trim()) {
      return Response.json({ error: "Укажите ваше имя" }, { status: 400 });
    }

    const digits = phone?.replace(/\D/g, "") || "";
    if (digits.length < 10) {
      return Response.json({ error: "Укажите корректный номер телефона" }, { status: 400 });
    }

    await prisma.callbackRequest.create({
      data: { name: name.trim(), phone: phone.trim() },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
