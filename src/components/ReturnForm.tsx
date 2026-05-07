"use client";

import { useState } from "react";
import { showToast } from "@/components/Toast";

export default function ReturnForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !orderNumber || !reason) {
      showToast("Заполните все поля");
      return;
    }
    setSubmitted(true);
    showToast("Заявка на возврат отправлена!");
  };

  return (
    <div className="bg-bg-white rounded-xl border border-border p-5 sm:p-6">
      <h2 className="font-heading text-base font-bold text-text-dark mb-4">Заявка на возврат</h2>

      {submitted ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-text-dark mb-2">Заявка отправлена!</h3>
          <p className="text-sm text-text-gray">Мы свяжемся с вами в ближайшее время для уточнения деталей.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-dark mb-1">Ваше имя *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-text-dark mb-1">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-text-dark mb-1">Номер заказа *</label>
            <input type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-text-dark mb-1">Причина возврата *</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
          </div>
          <button type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
            Отправить заявку
          </button>
          <p className="text-[10px] text-text-light text-center">
            Нажимая кнопку, вы соглашаетесь с <a href="/privacy" className="text-primary hover:underline">политикой конфиденциальности</a>
          </p>
        </form>
      )}
    </div>
  );
}
