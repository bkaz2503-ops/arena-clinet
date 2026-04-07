import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = "7d";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAuthToken(payload: { sub: string; role: string }) {
  const secret = process.env.JWT_SECRET ?? "development-secret";

  return jwt.sign(payload, secret, {
    expiresIn: JWT_EXPIRES_IN
  });
}

export function verifyAuthToken(token: string) {
  const secret = process.env.JWT_SECRET ?? "development-secret";
  return jwt.verify(token, secret);
}
