import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import bcrypt from "bcryptjs"

const secretKey = process.env.JWT_SECRET || "your-secret-key"
const key = new TextEncoder().encode(secretKey)

export interface SessionPayload {
  userId: string
  email: string
  role: "employee" | "manager"
  name: string
}

export async function encrypt(payload: SessionPayload) {
  // Set token expiration to ~10 years.
  // jose's setExpirationTime can accept a numeric epoch (in seconds). We compute
  // current epoch + seconds for 10 years to set a long-lived JWT.
  const tenYearsInSeconds = 10 * 365 * 24 * 60 * 60 // 315360000
  const exp = Math.floor(Date.now() / 1000) + tenYearsInSeconds

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(key)
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    })
    return payload as SessionPayload
  } catch (error) {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get("session")?.value
  if (!session) return null
  return await decrypt(session)
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const session = request.cookies.get("session")?.value
  if (!session) return null
  return await decrypt(session)
}

export function isManager(session: SessionPayload | null): boolean {
  return session?.role === "manager"
}

export function isEmployee(session: SessionPayload | null): boolean {
  return session?.role === "employee"
}
