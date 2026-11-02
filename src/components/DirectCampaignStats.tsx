"use client";
import { useState } from "react";
import type { DirectReport } from "@/lib/direct-report";

export default function DirectCampaignStats({token}: {token: string}) {
  const [id, setId] = useState("");
  const [data, setData] = useState<DirectReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function load() {
    if (!/^[1-9][0-9]{0,19}$/.test(id)) { setError("Укажите числовой ID кампании Директа."); return; }
    setLoading(true); setError(""); setData(null);
    try {
      const r = await fetch(`/api/admin/direct-report?id=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const body = await r.json(); if (!r.ok) throw new Error(body.error || "Ошибка загрузки"); setData(body);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка загрузки"); } finally { setLoading(false); }
  }
  const fmt = (n: number | null | undefined) => n == null ? "Нет данных" : n.toLocaleString("ru-RU", {maximumFractionDigits: 2});
  return <div className="bg-white border border-border rounded-xl p-5 space-y-3">
    <h3 className="font-bold text-lg">Отчёт Яндекс Директа</h3>
    <p className="text-sm text-text-gray">Введите ID кампании из Директа. Данные загружаются по запросу за последние 30 дней; это отдельный отчёт рекламного кабинета, не статистика посещений страницы.</p>
    <label htmlFor="direct-campaign-id" className="block text-sm font-semibold">ID кампании Директа</label>
    <div className="flex flex-wrap gap-2"><input id="direct-campaign-id" inputMode="numeric" value={id} onChange={e => setId(e.target.value)} className="border border-border rounded-lg px-3 py-2 min-h-11 max-w-full" placeholder="Например, 123456" /><button type="button" onClick={load} disabled={loading} className="bg-primary text-white rounded-lg px-4 py-2 min-h-11 disabled:opacity-50">{loading ? "Загрузка…" : "Получить отчёт"}</button></div>
    {error && <p role="alert" className="text-danger text-sm">{error}</p>}
    {data?.state === "pending" && <p role="status" className="text-sm">Директ формирует отчёт. Повторите запрос через минуту.</p>}
    {data?.state === "empty" && <p role="status" className="text-sm">Данные за период не найдены.</p>}
    {data?.state === "ready" && <div role="status" className="grid grid-cols-2 gap-3 text-sm"><p>Показы: <strong>{fmt(data.impressions)}</strong></p><p>Клики: <strong>{fmt(data.clicks)}</strong></p><p>Расход с НДС: <strong>{fmt(data.cost)}</strong> <span className="text-text-gray">в валюте кабинета</span></p><p>Конверсии: <strong>{fmt(data.conversions)}</strong></p></div>}
    <p className="text-xs text-text-gray">Для конверсий нужны связанные счётчик и цели Метрики. ID вводится вручную и не привязывается автоматически к подборкам товаров. Токен хранится только в окружении сервера. Настройка и ограничения — в инструкции.</p>
  </div>;
}
