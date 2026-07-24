"use client";

import { useState, useEffect, useRef, useCallback, startTransition } from "react";
import { usePathname } from "next/navigation";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import { useLiveMessages } from "@/components/useLiveMessages";

interface Session {
  chatId: string;
  token: string;
  name: string;
}

const STORAGE_KEY = "support_chat";

export default function SupportChatWidget() {
  const pathname = usePathname();
  const { get, loaded } = useSiteSettings();

  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const listRef = useRef<HTMLDivElement | null>(null);
  const seenAdmin = useRef(0);
  const inited = useRef(false);
  const [unread, setUnread] = useState(0);

  // Восстанавливаем сессию гостя из localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Session;
        if (parsed?.chatId && parsed?.token) startTransition(() => setSession(parsed));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const streamUrl = session ? `/api/chat/stream?chatId=${session.chatId}&token=${session.token}` : null;
  const listUrl = session ? `/api/chat/messages?chatId=${session.chatId}&token=${session.token}` : null;
  const { messages, upsert, reload } = useLiveMessages({ streamUrl, listUrl });

  // Счётчик непрочитанных ответов администратора (когда окно свёрнуто).
  useEffect(() => {
    const adminCount = messages.filter((m) => m.senderRole === "admin").length;
    if (!inited.current) {
      inited.current = true;
      seenAdmin.current = adminCount;
      return;
    }
    if (open) {
      seenAdmin.current = adminCount;
      startTransition(() => setUnread(0));
    } else {
      startTransition(() => setUnread(Math.max(0, adminCount - seenAdmin.current)));
    }
  }, [messages, open]);

  // Автопрокрутка вниз при новых сообщениях и открытии.
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const startChat = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Введите имя");
      return;
    }
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { chatId: string; token: string; guestName?: string };
      const next: Session = { chatId: data.chatId, token: data.token, name: data.guestName ?? trimmed };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
    } catch {
      setError("Не удалось начать чат. Попробуйте ещё раз.");
    } finally {
      setStarting(false);
    }
  }, [name]);

  const sendMessage = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !session) return;
    setSending(true);
    setText("");
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: session.chatId, token: session.token, text: trimmed }),
      });
      if (res.ok) {
        // Мгновенное эхо: показываем своё сообщение сразу, не дожидаясь SSE.
        upsert([await res.json()]);
      } else {
        setText(trimmed);
        void reload();
      }
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }, [text, session, upsert, reload]);

  // Не показываем виджет в админке и на страницах, где он не нужен.
  const hidden = pathname?.startsWith("/admin");
  const enabled = !loaded || get("chat-widget-enabled", "1") !== "0";
  if (hidden || !enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div className="w-[92vw] max-w-sm h-[70vh] max-h-[520px] bg-bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-[fadeIn_.15s_ease]">
          {/* Шапка */}
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">💬</span>
              <div>
                <p className="font-semibold leading-tight">Чат с поддержкой</p>
                <p className="text-xs text-white/80 leading-tight">Обычно отвечаем быстро</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Свернуть чат" className="text-white/90 hover:text-white text-xl leading-none px-1">
              ×
            </button>
          </div>

          {!session ? (
            // Форма знакомства: гостю достаточно ввести имя.
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
              <div className="text-4xl">👋</div>
              <div>
                <p className="font-semibold text-text-dark">Здравствуйте!</p>
                <p className="text-sm text-text-gray mt-1">Как вас зовут? Напишите имя, чтобы начать общение — регистрация не нужна.</p>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") startChat(); }}
                placeholder="Ваше имя"
                autoFocus
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
              {error && <p className="text-danger text-xs">{error}</p>}
              <button
                onClick={startChat}
                disabled={starting}
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {starting ? "Подключаем…" : "Начать чат"}
              </button>
            </div>
          ) : (
            <>
              {/* Лента сообщений */}
              <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-bg-light">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-text-gray italic mt-4">
                    Напишите первое сообщение — мы на связи.
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                      m.senderRole === "guest"
                        ? "bg-primary text-white ml-auto rounded-br-sm"
                        : "bg-bg-white border border-border text-text-dark rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p className={`text-[10px] mt-1 ${m.senderRole === "guest" ? "text-white/70" : "text-text-light"}`}>
                      {new Date(m.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>

              {/* Ввод */}
              <div className="p-2.5 border-t border-border flex gap-2 shrink-0 bg-bg-white">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Введите сообщение…"
                  className="flex-1 border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !text.trim()}
                  aria-label="Отправить"
                  className="bg-primary hover:bg-primary-dark text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 shrink-0"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Плавающая кнопка-виджет (оверлей) */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Свернуть чат" : "Открыть чат с поддержкой"}
        className="relative w-14 h-14 rounded-full bg-primary hover:bg-primary-dark text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      >
        {open ? (
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-danger text-white text-xs font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}
