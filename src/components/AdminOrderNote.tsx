"use client";
import { useEffect, useState, startTransition } from "react";

/** Not shared with the customer comment or order chat. Admin-only API. */
export default function AdminOrderNote({ orderId, note, token, onSaved }: {
  orderId: string; note: string; token: string; onSaved: () => void;
}) {
  const [savedNote, setSavedNote] = useState(note);
  const [draft, setDraft] = useState(note);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { startTransition(() => setSavedNote(note)); }, [note]);
  const begin = () => { setDraft(savedNote); setError(""); setMessage(""); setEditing(true); };
  const save = async () => {
    if (saving) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: orderId, adminNote: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось сохранить заметку");
      setSavedNote(data.adminNote); setDraft(data.adminNote); setEditing(false);
      setMessage(data.adminNote ? "Заметка сохранена" : "Заметка удалена");
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка сохранения"); }
    finally { setSaving(false); }
  };
  return <section aria-label={`Внутренняя заметка заказа ${orderId}`} className="mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50">
    <h3 className="text-sm font-medium text-text-dark">Заметка администратора</h3>
    <p className="text-xs text-text-gray mb-2">Внутренняя пометка — покупатель её не видит</p>
    {editing ? <>
      <label className="sr-only" htmlFor={`admin-note-${orderId}`}>Текст заметки администратора</label>
      <textarea id={`admin-note-${orderId}`} value={draft} onChange={e => setDraft(e.target.value)} disabled={saving}
        maxLength={5000} rows={4} placeholder="Например: уточнить адрес, перезвонить после 18:00"
        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-bg-white focus:outline-none focus:border-primary" />
      <p className="text-xs text-text-gray mb-2">{draft.length} / 5000 · Чтобы удалить заметку, очистите поле и сохраните</p>
      <div className="flex gap-3">
        <button onClick={() => void save()} disabled={saving} className="bg-primary text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-50">{saving ? "Сохранение…" : "Сохранить заметку"}</button>
        <button onClick={() => { setEditing(false); setError(""); }} disabled={saving} className="text-sm border border-border px-3 py-1.5 rounded-lg disabled:opacity-50">Отмена</button>
      </div>
    </> : <>
      {savedNote ? <p className="text-sm text-text-dark whitespace-pre-wrap break-words mb-2">{savedNote}</p> : <p className="text-xs text-text-gray mb-2">Заметки пока нет</p>}
      <button onClick={begin} className="text-sm text-primary hover:underline">{savedNote ? "Редактировать заметку" : "Добавить заметку"}</button>
    </>}
    {error && <p role="alert" className="text-danger text-sm mt-2">{error}</p>}
    {message && <p role="status" className="text-success text-xs mt-2">{message}</p>}
  </section>;
}
