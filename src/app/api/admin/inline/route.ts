import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

const ALLOWED_MODELS: Record<string, { table: string; fields: string[] }> = {
  product: {
    table: "product",
    fields: ["name", "description", "price", "oldPrice", "brand", "tags"],
  },
  category: {
    table: "category",
    fields: ["name", "icon", "metaTitle", "metaDescription", "seoText"],
  },
  slider: {
    table: "sliderImage",
    fields: ["title", "subtitle", "link"],
  },
  news: {
    table: "news",
    fields: ["title", "excerpt", "content"],
  },
};

export async function PATCH(request: Request) {
  if (!checkAdmin(request))
    return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json();
  const { model, id, field, value } = body as {
    model: string;
    id: string;
    field: string;
    value: string | number;
  };

  if (!model || !id || !field) {
    return Response.json(
      { error: "model, id и field обязательны" },
      { status: 400 }
    );
  }

  const config = ALLOWED_MODELS[model];
  if (!config || !config.fields.includes(field)) {
    return Response.json(
      { error: `Недопустимая модель или поле: ${model}.${field}` },
      { status: 400 }
    );
  }

  let parsedValue: string | number | null = value;
  if (field === "price" || field === "oldPrice") {
    parsedValue = value === "" || value === null ? null : Number(value);
  }

  const updated = await (prisma as Record<string, any>)[config.table].update({
    where: { id },
    data: { [field]: parsedValue },
  });

  return Response.json(updated);
}

export async function PUT(request: Request) {
  if (!checkAdmin(request))
    return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json();
  const { model, orderedIds } = body as {
    model: string;
    orderedIds: string[];
  };

  if (!model || !Array.isArray(orderedIds)) {
    return Response.json(
      { error: "model и orderedIds обязательны" },
      { status: 400 }
    );
  }

  const tableMap: Record<string, string> = {
    category: "category",
    slider: "sliderImage",
  };

  const table = tableMap[model];
  if (!table) {
    return Response.json(
      { error: `Перестановка не поддерживается для: ${model}` },
      { status: 400 }
    );
  }

  await Promise.all(
    orderedIds.map((id: string, index: number) =>
      (prisma as Record<string, any>)[table].update({
        where: { id },
        data: { order: index },
      })
    )
  );

  return Response.json({ success: true });
}
