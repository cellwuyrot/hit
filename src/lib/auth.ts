import jwt from "jsonwebtoken";
import crypto from "crypto";

export type TokenPayload = {
  id: string;
  username?: string;
  email?: string;
  role: "admin" | "user";
};

let devSecret: string | null = null;

/**
 * Секрет вычисляется лениво, а не на импорте модуля: `next build` выполняется
 * с NODE_ENV=production и импортирует все роуты, поэтому проверка на этапе
 * загрузки уронила бы сборку на машине без .env.
 */
function getSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length > 0) return fromEnv;

  // В рантайме прода отсутствие секрета — фатальная ошибка конфигурации:
  // случайный ключ разлогинивал бы всех при каждом рестарте, а захардкоженный
  // fallback позволял бы кому угодно подделать админский токен.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET не задан. Укажите его в .env — работа в production без секрета невозможна."
    );
  }

  if (!devSecret) devSecret = crypto.randomBytes(32).toString("hex");
  return devSecret;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "30d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as TokenPayload;
    if (!decoded || typeof decoded.id !== "string" || (decoded.role !== "admin" && decoded.role !== "user")) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim() || null;
  }
  return null;
}

/** Полезная нагрузка токена, если он валиден и принадлежит администратору. */
export function getAdminPayload(request: Request): TokenPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

/** true, если запрос выполнен администратором. */
export function isAdminRequest(request: Request): boolean {
  return getAdminPayload(request) !== null;
}

/** id пользователя, если запрос выполнен авторизованным покупателем. */
export function getUserIdFromRequest(request: Request): string | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== "user") return null;
  return payload.id;
}
