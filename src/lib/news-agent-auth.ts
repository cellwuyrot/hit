import { timingSafeEqual } from "node:crypto";

/**
 * Validates the dedicated server-to-server key used by the local news agent.
 * The key is never returned to the browser or included in error responses.
 */
export function checkNewsAgentAuth(request: Request): Response | null {
  const expected = process.env.NEWS_AGENT_API_KEY?.trim();
  if (!expected || expected.length < 32) {
    return Response.json(
      { error: "API локального агента не настроено на сервере." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const actual = match?.[1]?.trim();
  if (!actual) {
    return Response.json(
      { error: "Требуется ключ локального агента." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const expectedBytes = Buffer.from(expected);
  const actualBytes = Buffer.from(actual);
  if (
    actualBytes.length !== expectedBytes.length ||
    !timingSafeEqual(actualBytes, expectedBytes)
  ) {
    return Response.json(
      { error: "Неверный ключ локального агента." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return null;
}