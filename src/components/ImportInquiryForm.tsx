"use client";

import { useState } from "react";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  const d = digits.startsWith("8") ? "7" + digits.slice(1) : digits.startsWith("7") ? digits : "7" + digits;
  let result = "+7";
  if (d.length > 1) result += " (" + d.slice(1, 4);
  if (d.length >= 4) result += ")";
  if (d.length > 4) result += " " + d.slice(4, 7);
  if (d.length > 7) result += "-" + d.slice(7, 9);
  if (d.length > 9) result += "-" + d.slice(9, 11);
  return result;
}

export default function ImportInquiryForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw.length < 2) {
      setPhone("+7");
      return;
    }
    setPhone(formatPhone(raw));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Укажите ваше имя");
      return;
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 11) {
      setError("Введите полный номер телефона");
      return;
    }

    setLoading(true);
    try {
      const fullName = comment.trim()
        ? `${name.trim()} (импорт: ${comment.trim()})`
        : `${name.trim()} (импортный товар)`;
      const res = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, phone }),
      });
      if (res.ok) {
        setSent(true);
        setName("");
        setPhone("+7");
        setComment("");
      } else {
        const data = await res.json();
        setError(data.error || "Ошибка отправки");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-text-dark mb-2">Заявка отправлена!</h3>
        <p className="text-sm text-text-gray">Наш менеджер по импортным поставкам свяжется с вами в ближайшее время.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-danger text-sm">{error}</p>}
      <div>
        <label className="text-sm text-text-gray mb-1 block">Ваше имя *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Иван"
          required
          className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="text-sm text-text-gray mb-1 block">Телефон *</label>
        <input
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="+7 (___) ___-__-__"
          required
          className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 font-mono"
        />
      </div>
      <div>
        <label className="text-sm text-text-gray mb-1 block">Какой товар интересует</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Опишите импортный товар, который вы ищете"
          className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
      >
        {loading ? "Отправка..." : "Оставить заявку"}
      </button>
    </form>
  );
}
