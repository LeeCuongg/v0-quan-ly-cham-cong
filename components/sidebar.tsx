"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  LayoutDashboard,
  Users,
  Clock,
  Menu,
  Building2,
  LogIn,
  BarChart3,
  History,
  UserCog,
  User,
  CalendarDays,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

const managerNavigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Nhân viên",
    href: "/employees",
    icon: Users,
  },
  {
    name: "Quản lý chấm công",
    href: "/timesheets",
    icon: Clock,
  },
  {
    name: "Quản lý người dùng",
    href: "/users",
    icon: UserCog,
  },
]

const employeeNavigation = [
  {
    name: "Chấm công",
    href: "/checkin",
    icon: LogIn,
  },
  {
    name: "Lịch sử của tôi",
    href: "/my-timesheets",
    icon: History,
  },
  {
    name: "Thống kê của tôi",
    href: "/my-stats",
    icon: BarChart3,
  },
  {
    name: "Lịch làm việc",
    href: "/schedule",
    icon: CalendarDays,
  },
  {
    name: "Hồ sơ cá nhân",
    href: "/profile",
    icon: User,
  },
]

interface SidebarProps {
  userRole?: "manager" | "employee"
}

export function Sidebar({ userRole = "manager" }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { logout, user } = useAuth()

  const navigation = userRole === "manager" ? managerNavigation : employeeNavigation

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoggingOut(false)
      setShowLogoutDialog(false)
    }
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <Building2 className="h-8 w-8 text-sidebar-primary" />
        <span className="text-xl font-bold text-sidebar-foreground">Công Anh Chấm Công</span>
      </div>

      <div className="px-4 py-2 border-b border-sidebar-border">
        <span className="text-xs text-sidebar-muted-foreground uppercase tracking-wide">
          {userRole === "manager" ? "Quản lý" : "Nhân viên"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              onClick={() => setOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout Section */}
      <div className="border-t border-sidebar-border p-4 space-y-3">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-sidebar-primary-foreground">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-sidebar-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Logout button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLogoutDialog(true)}
          className="w-full justify-start gap-3 bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden fixed top-4 left-4 z-40 bg-transparent">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Mở menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-destructive" />
              Xác nhận đăng xuất
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              disabled={isLoggingOut}
            >
              Quay lại
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="gap-2"
            >
              {isLoggingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Đang đăng xuất...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Xác nhận
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
