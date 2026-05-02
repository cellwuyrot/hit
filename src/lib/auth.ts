import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");

export function signToken(payload: { id: string; username?: string; email?: string; role: "admin" | "user" }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): { id: string; username?: string; email?: string; role: "admin" | "user" } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; username?: string; email?: string; role: "admin" | "user" };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}
