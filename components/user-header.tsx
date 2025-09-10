"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User, Settings, ChevronDown } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"

export function UserHeader() {
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isOpen, setIsOpen] = useState(false) // Thêm state để control dropdown

  if (!user) return null

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
      setIsOpen(false) // Đóng dropdown sau khi logout
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeVariant = (role: string) => {
    return role === "manager" ? "default" : "secondary"
  }

  const getRoleLabel = (role: string) => {
    return role === "manager" ? "Quản lý" : "Nhân viên"
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex-1" />

      {/* User Info & Dropdown */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-foreground">{user.name}</span>
          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
            {getRoleLabel(user.role)}
          </Badge>
        </div>

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 h-auto p-2 hover:bg-accent"
              onClick={() => setIsOpen(!isOpen)} // Toggle dropdown
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-popover border shadow-md z-50"
            sideOffset={5}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs w-fit mt-1">
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user.role === "employee" && (
              <DropdownMenuItem asChild>
                <Link href="/profile" onClick={() => setIsOpen(false)}>
                  <User className="w-4 h-4 mr-2" />
                  Thông tin cá nhân
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setIsOpen(false)}>
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
