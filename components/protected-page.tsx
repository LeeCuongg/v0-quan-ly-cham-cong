"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"
import { UserHeader } from "@/components/user-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface ProtectedPageProps {
  children: React.ReactNode
  requiredRole?: "manager" | "employee"
  allowedRoles?: ("manager" | "employee")[]
}

export function ProtectedPage({ children, requiredRole, allowedRoles }: ProtectedPageProps) {
  const { user, isLoading, isManager, isEmployee } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Đang tải...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>Bạn cần đăng nhập để truy cập trang này.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const hasAccess = () => {
    if (requiredRole) {
      return user.role === requiredRole
    }
    if (allowedRoles) {
      return allowedRoles.includes(user.role)
    }
    return true // No role restriction
  }

  if (!hasAccess()) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar userRole={user.role} />
        <div className="flex-1 lg:pl-72">
          <UserHeader />
          <main className="p-4 lg:p-8">
            <Alert variant="destructive">
              <AlertDescription>Bạn không có quyền truy cập trang này.</AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userRole={user.role} />
      <div className="flex-1 lg:pl-72 flex flex-col">
        <UserHeader />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  )
}
