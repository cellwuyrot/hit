import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "tophit-secret-key-2024";

function checkAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth) return false;
  try {
    jwt.verify(auth.replace("Bearer ", ""), SECRET);
    return true;
  } catch {
    return false;
  }
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
