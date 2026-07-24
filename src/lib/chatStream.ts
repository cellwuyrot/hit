import { prisma } from "@/lib/prisma";

/**
 * Создаёт SSE-поток (Server-Sent Events) с новыми сообщениями чата.
 *
 * Поток отдаёт сообщения по мере их появления в БД: раз в секунду он
 * опрашивает таблицу SupportMessage и досылает всё, что ещё не отправлял.
 * Такой «server-side polling → push» даёт клиенту сообщения практически без
 * задержки, при этом сам клиент держит одно постоянное соединение вместо
 * частых запросов.
 *
 * Идентичные сообщения не задваиваются: на клиенте выполняется merge по id,
 * а здесь мы храним множество уже отправленных id.
 */
export function createChatMessageStream(chatId: string, signal: AbortSignal): Response {
  const encoder = new TextEncoder();
  // Небольшое окно «в прошлое», чтобы не потерять сообщения, пришедшие
  // между первичной загрузкой истории и открытием SSE-соединения.
  let since = new Date(Date.now() - 60_000);
  const seen = new Set<string>();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(poll);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* уже закрыт */
        }
      };

      // Подсказываем браузеру интервал переподключения (мс).
      send("retry: 3000\n\n");

      const tick = async () => {
        if (closed) return;
        try {
          const messages = await prisma.supportMessage.findMany({
            where: { chatId, createdAt: { gte: since } },
            orderBy: { createdAt: "asc" },
          });
          for (const m of messages) {
            if (seen.has(m.id)) continue;
            seen.add(m.id);
            if (m.createdAt > since) since = m.createdAt;
            send(`data: ${JSON.stringify(m)}\n\n`);
          }
        } catch {
          /* временная ошибка БД — попробуем на следующем тике */
        }
      };

      const poll = setInterval(tick, 1000);
      // Комментарий-heartbeat не даёт прокси разорвать соединение по таймауту.
      const heartbeat = setInterval(() => send(": ping\n\n"), 25_000);

      signal.addEventListener("abort", cleanup);
      void tick();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
