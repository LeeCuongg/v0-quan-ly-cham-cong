// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

// ---------- Config / Env ----------
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JWT_SECRET = process.env.JWT_SECRET!;
const IS_PROD = process.env.NODE_ENV === "production";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !JWT_SECRET) {
  // In production this should crash early so you notice missing config.
  console.error(
    "Missing required env vars. Ensure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and JWT_SECRET are set."
  );
}

// ---------- Supabase server client (use service role key on server only) ----------
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---------- Helper: sign JWT ----------
async function createSessionToken(payload: Record<string, any>, expiresInSeconds = 60 * 60 * 24) {
  // Using jose to sign token (HS256)
  const alg = "HS256";
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(JWT_SECRET);

  // set "exp" claim
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(secretKey);

  return token;
}

// ---------- Main handler ----------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const email = String((body.email ?? "").trim()).toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email và mật khẩu là bắt buộc" }, { status: 400 });
    }

    // Fetch user from Supabase (server-side)
    // We select only columns we need and exclude sensitive ones we don't need to return.
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, email, role, is_active, password_hash, password")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[auth/login] Supabase query error:", error);
      return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
    }

    const user = data as
      | {
          id: string;
          name: string;
          email: string;
          role: string;
          is_active: boolean;
          password_hash?: string | null;
          password?: string | null; // legacy plain text column (if exists)
        }
      | null;

    if (!user) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "Tài khoản đã bị khoá" }, { status: 403 });
    }

    // Password validation:
    // 1) If password_hash exists, compare via bcrypt.
    // 2) Else (legacy) fallback to plain-text column `password` (NOT recommended) but allow temporarily.
    // 3) Also keep - for testing only - special default passwords (optional).
    let isValidPassword = false;

    if (user.password_hash) {
      try {
        isValidPassword = await bcrypt.compare(password, user.password_hash);
      } catch (e) {
        console.warn("[auth/login] bcrypt.compare error:", e);
        isValidPassword = false;
      }
    } else if (user.password) {
      // Legacy fallback: plain-text comparison (temporary only) - log a warning.
      console.warn(
        `[auth/login] User ${email} auth using legacy plain-text password. Please migrate to hashed passwords.`
      );
      isValidPassword = password === user.password;
    }

    // Optional: allow default test passwords (remove in strict production).
    // Example: admin default and employee default (if you want). Keep commented if not needed.
    // if (!isValidPassword) {
    //   if (password === "admin123" && user.role === "admin") isValidPassword = true;
    //   if (password === "emp123" && user.role === "employee") isValidPassword = true;
    // }

    if (!isValidPassword) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    // Build session payload (keep minimal)
    const sessionPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    // Create JWT (24h)
    const token = await createSessionToken(sessionPayload, 60 * 60 * 24);

    // Set cookie
    const cookieOptions = {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24, // seconds
    };

    cookies().set({
      name: "session",
      value: token,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    // Return safe user info (no password)
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return NextResponse.json({ success: true, user: safeUser });
  } catch (err) {
    console.error("[auth/login] Unexpected error:", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
