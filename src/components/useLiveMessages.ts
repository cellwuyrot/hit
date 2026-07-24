"use client";

import { useState, useEffect, useCallback, startTransition } from "react";

export interface ChatMsg {
  id: string;
  senderRole: string;
  text: string;
  createdAt: string;
}

interface Options {
  /** Полный URL SSE-потока (с query-параметрами) или null, если чат не начат. */
  streamUrl: string | null;
  /** Полный URL для загрузки истории сообщений (с query) или null. */
  listUrl: string | null;
  /** JWT администратора — если задан, уходит заголовком Authorization в listUrl. */
  authToken?: string;
}

/**
 * Живая лента сообщений одного чата.
 *
 * Комбинирует три источника, чтобы доставка была мгновенной и надёжной:
 *  1. Первичная загрузка истории через listUrl.
 *  2. SSE-поток (streamUrl) — новые сообщения приходят почти без задержки.
 *  3. Страховочная сверка раз в 5 секунд (если SSE временно оборвался).
 *
 * Дедупликация выполняется по id сообщения, поэтому один и тот же элемент
 * из разных источников не задваивается.
 */
export function useLiveMessages({ streamUrl, listUrl, authToken }: Options) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  const upsert = useCallback((incoming: ChatMsg[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) map.set(m.id, m);
      return Array.from(map.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });
  }, []);

  const reload = useCallback(async () => {
    if (!listUrl) return;
    try {
      const res = await fetch(listUrl, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) upsert(data);
      }
    } catch {
      /* сеть недоступна — попробуем на следующей сверке */
    }
  }, [listUrl, authToken, upsert]);

  useEffect(() => {
    startTransition(() => setMessages([]));
    if (!streamUrl && !listUrl) return;

    void reload();

    let es: EventSource | null = null;
    if (streamUrl) {
      es = new EventSource(streamUrl);
      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data) as ChatMsg;
          if (msg && msg.id) upsert([msg]);
        } catch {
          /* игнорируем heartbeat и мусор */
        }
      };
      // EventSource переподключается сам; сверка ниже подстрахует пропуски.
    }

    const reconcile = setInterval(reload, 5000);

    return () => {
      es?.close();
      clearInterval(reconcile);
    };
  }, [streamUrl, listUrl, reload, upsert]);

  return { messages, upsert, reload };
}
