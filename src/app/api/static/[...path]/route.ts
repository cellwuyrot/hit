import { readFile } from "fs/promises";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const fileName = segments.join("/");

  if (fileName.includes("..")) {
    return new Response("Forbidden", { status: 403 });
  }

  const ext = path.extname(fileName).toLowerCase();
  if (!MIME_TYPES[ext]) {
    return new Response("Not found", { status: 404 });
  }

  // Дополнительно к проверке ".." выше — гарантируем, что итоговый путь
  // не выходит за пределы public/.
  const baseDir = path.join(process.cwd(), "public");
  const filePath = path.resolve(baseDir, fileName);
  if (filePath !== baseDir && !filePath.startsWith(baseDir + path.sep)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const buffer = await readFile(filePath);
    return new Response(buffer, {
      headers: {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
