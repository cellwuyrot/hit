import { isAdminRequest } from "@/lib/auth";
import { getDirectReport } from "@/lib/direct-report";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[1-9][0-9]{0,19}$/.test(id)) return Response.json({ error: "Укажите числовой ID кампании Директа." }, { status: 400 });
  try {
    const report = await getDirectReport(id, process.env.YANDEX_DIRECT_TOKEN || "", process.env.YANDEX_DIRECT_CLIENT_LOGIN || "");
    return Response.json(report, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Ошибка отчёта" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
