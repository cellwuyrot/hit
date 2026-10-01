"use client";
import { useCallback, useEffect, useState, startTransition } from "react";
interface Promo {
  id: string; code: string; discountType: string; discountValue: number; minOrder: number;
  maxUses: number; usedCount: number; active: boolean; startsAt: string | null; expiresAt: string | null;
}
const initial = { id: "", code: "", discountType: "percent", discountValue: 15, minOrder: 0, maxUses: 0, active: true, startsAt: "", expiresAt: "" };
function localDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
export default function PromoCodesPanel({ token }: { token: string }) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promo", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Не удалось загрузить промокоды");
      setPromos(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка загрузки"); }
  }, [token]);
  useEffect(() => { startTransition(() => { void load(); }); }, [load]);
  const save = async (data = form) => {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/promo", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...data, startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : null, expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setForm(initial); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка сохранения"); }
    finally { setSaving(false); }
  };
  const editData = (p: Promo) => ({ id: p.id, code: p.code, discountType: p.discountType, discountValue: p.discountValue, minOrder: p.minOrder, maxUses: p.maxUses, active: p.active, startsAt: localDate(p.startsAt), expiresAt: localDate(p.expiresAt) });
  const inputClass = "w-full border border-border rounded-lg px-3 py-2";
  return <section className="mt-6 bg-bg-white rounded-xl border border-border p-5" aria-label="Промокоды">
    <h2 className="font-bold text-text-dark mb-4">Настройки → Промокоды</h2>
    {error && <p role="alert" className="text-danger mb-3">{error}</p>}
    <form onSubmit={e => { e.preventDefault(); void save(); }} className="grid sm:grid-cols-2 gap-3 mb-5">
      <label className="text-sm">Код<input aria-label="Код промокода" required maxLength={64} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className={inputClass} /></label>
      <label className="text-sm">Тип скидки<select aria-label="Тип скидки" value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} className={inputClass}><option value="percent">Процент</option><option value="fixed">Фиксированная сумма (₽)</option></select></label>
      <label className="text-sm">Скидка<input required aria-label="Скидка" type="number" min="0.01" max={form.discountType === "percent" ? 100 : undefined} step="0.01" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })} className={inputClass} /></label>
      <label className="text-sm">Минимальная сумма заказа (₽)<input aria-label="Минимальная сумма" type="number" min="0" step="0.01" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: Number(e.target.value) })} className={inputClass} /></label>
      <label className="text-sm">Начало (местное время)<input aria-label="Начало действия" type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} className={inputClass} /></label>
      <label className="text-sm">Окончание (местное время)<input aria-label="Окончание действия" type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className={inputClass} /></label>
      <label className="text-sm">Лимит использований (0 — без лимита)<input aria-label="Лимит использований" type="number" min="0" step="1" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: Number(e.target.value) })} className={inputClass} /></label>
      <label className="flex items-center gap-2 text-sm"><input aria-label="Активен" type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />Активен</label>
      <button disabled={saving} className="bg-primary text-white rounded-lg px-4 py-2 disabled:opacity-50">{form.id ? "Сохранить промокод" : "Создать промокод"}</button>
      {form.id && <button type="button" onClick={() => setForm(initial)} className="border border-border rounded-lg px-4 py-2">Отмена</button>}
    </form>
    <div className="space-y-3">{promos.map(p => <div key={p.id} className="border border-border rounded-lg p-3 text-sm">
      <div className="font-bold">{p.code} — {p.discountValue}{p.discountType === "percent" ? "%" : " ₽"} ({p.active ? "включён" : "отключён"})</div>
      <p>От {p.minOrder} ₽ · Использований: {p.usedCount} / {p.maxUses || "∞"}</p>
      <p>Начало: {p.startsAt ? new Date(p.startsAt).toLocaleString("ru-RU") : "без ограничения"} · Окончание: {p.expiresAt ? new Date(p.expiresAt).toLocaleString("ru-RU") : "без ограничения"}</p>
      <div className="flex gap-4 mt-2"><button disabled={saving} onClick={() => setForm(editData(p))} className="text-primary">Редактировать</button><button disabled={saving} onClick={() => void save({ ...editData(p), startsAt: p.startsAt || "", expiresAt: p.expiresAt || "", active: !p.active })} className="text-primary">{p.active ? "Отключить" : "Включить"}</button></div>
    </div>)}</div>
  </section>;
}
