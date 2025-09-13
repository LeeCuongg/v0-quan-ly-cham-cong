import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionFromRequest } from "@/lib/auth"

// Define protected routes and their required roles
const protectedRoutes = {
  "/": ["manager", "employee"], // Dashboard - both roles
  "/employees": ["manager"], // Employee management - manager only
  "/timesheets": ["manager"],
  "/users": ["manager"], // User management - manager only
  "/checkin": ["employee"], // Check-in - employee only
  "/my-timesheets": ["employee"], // Personal timesheets - employee only
  "/my-stats": ["employee"], // Personal stats - employee only
  "/profile": ["employee"], // Profile management - employee only
  "/schedule": ["employee"], // Work schedule - employee only
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (pathname === "/login" || pathname.startsWith("/api/auth/login")) {
    return NextResponse.next()
  }

  // Check if route needs protection
  const requiredRoles = protectedRoutes[pathname as keyof typeof protectedRoutes]
  if (!requiredRoles) {
    return NextResponse.next()
  }

  // Get session from request
  const session = await getSessionFromRequest(request)

  // Redirect to login if no session
  if (!session) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access
  if (!requiredRoles.includes(session.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardUrl = new URL(session.role === "manager" ? "/timesheets" : "/checkin", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
