export type DirectReport = { state: "pending" | "empty" | "ready"; impressions?: number | null; clicks?: number | null; cost?: number | null; conversions?: number | null };

// Token and optional agency client login are never sent to the browser.
export async function getDirectReport(campaignId: string, token: string, clientLogin = "", fetcher: typeof fetch = fetch): Promise<DirectReport> {
  if (!/^[1-9][0-9]{0,19}$/.test(campaignId)) throw new Error("Укажите числовой ID кампании Директа.");
  if (!token) throw new Error("Токен Директа не настроен на сервере.");
  const end = new Date(), start = new Date(end.getTime() - 29 * 86400000);
  const dateFrom = start.toISOString().slice(0, 10), dateTo = end.toISOString().slice(0, 10);
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8", "Accept-Language": "ru", processingMode: "auto", returnMoneyInMicros: "false", skipReportHeader: "true", skipReportSummary: "true" };
  if (clientLogin) headers["Client-Login"] = clientLogin;
  const body = { params: { SelectionCriteria: { DateFrom: dateFrom, DateTo: dateTo, Filter: [{ Field: "CampaignId", Operator: "IN", Values: [campaignId] }] }, FieldNames: ["CampaignId", "Impressions", "Clicks", "Cost", "Conversions"], ReportName: `tophit_${campaignId}_${dateTo.replace(/-/g, "")}`, ReportType: "CAMPAIGN_PERFORMANCE_REPORT", DateRangeType: "CUSTOM_DATE", Format: "TSV", IncludeVAT: "YES", IncludeDiscount: "NO" } };
  let res: Response;
  try { res = await fetcher("https://api.direct.yandex.com/json/v501/reports", { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(15000), cache: "no-store" }); }
  catch { throw new Error("Не удалось связаться с API Директа. Попробуйте позже."); }
  if (res.status === 201 || res.status === 202) return { state: "pending" };
  if (!res.ok) throw new Error(`Директ отклонил запрос (HTTP ${res.status}). Проверьте доступ к API, токен, логин и ID кампании.`);
  const text = await res.text();
  if (text.length > 100_000) throw new Error("Неожиданный размер ответа Директа.");
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  if (!rows.length) return { state: "empty" };
  const expected = ["CampaignId", "Impressions", "Clicks", "Cost", "Conversions"];
  if (rows[0].replace(/^\uFEFF/, "").split("\t").join("|") !== expected.join("|")) throw new Error("Неожиданный формат отчёта Директа.");
  if (rows.length === 1) return { state: "empty" };
  if (rows.length !== 2) throw new Error("Отчёт содержит неожиданные строки.");
  const fields = rows[1].split("\t");
  if (fields.length !== 5 || fields[0] !== campaignId) throw new Error("Отчёт не соответствует выбранной кампании.");
  function value(raw: string): number | null { if (raw === "--" || raw === "-" || raw === "") return null; const n = Number(raw); if (!Number.isFinite(n) || n < 0) throw new Error("Некорректный показатель отчёта."); return n; }
  return { state: "ready", impressions: value(fields[1]), clicks: value(fields[2]), cost: value(fields[3]), conversions: value(fields[4]) };
}
