import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return Response.json({ error: "Файл не выбран" }, { status: 400 });

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "Максимальный размер файла: 10 МБ" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    if (!allowed.includes(ext)) {
      return Response.json({ error: "Поддерживаемые форматы: JPG, PNG, GIF, WEBP" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const valid = (ext === ".jpg" || ext === ".jpeg") ? buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) :
      ext === ".png" ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) :
      ext === ".gif" ? ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii")) :
      ext === ".webp" ? buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP" : false;
    if (!valid) return Response.json({ error: "Содержимое файла не соответствует формату изображения" }, { status: 400 });
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    return Response.json({ url: `/api/uploads/${fileName}` });
  } catch (err) {
    console.error("Upload error:", err);
    return Response.json({ error: "Ошибка при загрузке файла" }, { status: 500 });
  }
}
