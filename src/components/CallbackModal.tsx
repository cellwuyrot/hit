"use client";

import { useState } from "react";

export default function CallbackModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setOpen(false);
      setSent(false);
      setName("");
      setPhone("");
    }, 2500);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-sm text-primary hover:underline">
        Заказать звонок
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-text-gray hover:text-text-dark">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {sent ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-text-dark mb-2">Заявка отправлена!</h3>
                <p className="text-sm text-text-gray">Мы перезвоним вам в ближайшее время.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-text-dark mb-1">Заказать звонок</h3>
                <p className="text-sm text-text-gray mb-4">Оставьте номер и мы перезвоним</p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ваше имя"
                    required
                    className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (___) ___-__-__"
                    required
                    className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                  <button type="submit" className="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:bg-primary-dark transition-colors text-sm">
                    Перезвоните мне
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
