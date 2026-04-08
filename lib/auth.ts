import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { db } from "@/lib/db";

const JWT_EXPIRES_IN = "7d";
export const HOST_SESSION_COOKIE = "arena_host_session";

const PLACEHOLDER_HOST = {
  email: "host@arena-clinet.local",
  name: "Host Placeholder",
  profession: "Expositor demo",
  institution: "Arena-CliNet Demo",
  country: "Peru",
  whatsapp: null,
  password: "arena-clinet-host"
} as const;

export type HostSession = JwtPayload & {
  sub: string;
  role: string;
  email: string;
  name: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAuthToken(payload: {
  sub: string;
  role: string;
  email: string;
  name: string;
}) {
  const secret = process.env.JWT_SECRET ?? "development-secret";

  return jwt.sign(payload, secret, {
    expiresIn: JWT_EXPIRES_IN
  });
}

export function verifyAuthToken(token: string) {
  const secret = process.env.JWT_SECRET ?? "development-secret";

  try {
    return jwt.verify(token, secret) as HostSession;
  } catch {
    return null;
  }
}

export function buildHostSessionPayload(user: {
  id: string;
  role: string;
  email: string;
  name: string;
}) {
  return {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name
  };
}

export function setHostSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(HOST_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function getHostSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(HOST_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = verifyAuthToken(token);

  if (!session || (session.role !== "host" && session.role !== "admin")) {
    return null;
  }

  return session;
}

export async function ensurePlaceholderHost() {
  const passwordHash = await hashPassword(PLACEHOLDER_HOST.password);

  return db.user.upsert({
    where: {
      email: PLACEHOLDER_HOST.email
    },
    update: {},
    create: {
      email: PLACEHOLDER_HOST.email,
      name: PLACEHOLDER_HOST.name,
      profession: PLACEHOLDER_HOST.profession,
      institution: PLACEHOLDER_HOST.institution,
      country: PLACEHOLDER_HOST.country,
      whatsapp: PLACEHOLDER_HOST.whatsapp,
      password_hash: passwordHash,
      role: "host"
    }
  });
}
