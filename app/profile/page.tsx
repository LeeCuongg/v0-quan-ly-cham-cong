"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProtectedPage } from "@/components/protected-page"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Phone, DollarSign, Shield } from "lucide-react"

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  hourlyRate: number
  role: "employee" | "manager"
  createdAt?: string
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  })

  useEffect(() => {
    if (user) {
      setProfile({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        hourlyRate: user.hourlyRate,
        role: user.role,
      })
      setFormData({
        name: user.name,
        phone: user.phone || "",
      })
      setLoading(false)
    }
  }, [user])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        phone: profile.phone || "",
      })
    }
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!profile) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/users/${profile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
        }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setProfile({
          ...profile,
          name: updatedUser.name,
          phone: updatedUser.phone,
        })
        setIsEditing(false)
        toast({
          title: "Thành công",
          description: "Đã cập nhật thông tin cá nhân",
        })
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (loading) {
    return (
      <ProtectedPage requiredRole="employee">
        <main className="p-4 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-48"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </main>
      </ProtectedPage>
    )
  }

  if (!profile) {
    return (
      <ProtectedPage requiredRole="employee">
        <main className="p-4 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Không thể tải thông tin hồ sơ</p>
            </div>
          </div>
        </main>
      </ProtectedPage>
    )
  }

  return (
    <ProtectedPage requiredRole="employee">
      <main className="p-4 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Hồ sơ cá nhân</h1>
            <p className="text-muted-foreground">Quản lý thông tin cá nhân của bạn</p>
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin cá nhân
              </CardTitle>
              {!isEditing && (
                <Button onClick={handleEdit} variant="outline">
                  Chỉnh sửa
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Họ và tên
                  </Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Nhập họ và tên"
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-foreground">{profile.name}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-foreground">{profile.email}</span>
                    <p className="text-xs text-muted-foreground mt-1">Email không thể thay đổi</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Số điện thoại
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Nhập số điện thoại"
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-foreground">{profile.phone || "Chưa cập nhật"}</span>
                    </div>
                  )}
                </div>

                {/* Hourly Rate */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Lương theo giờ
                  </Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-foreground">{profile.hourlyRate.toLocaleString("vi-VN")}đ</span>
                    <p className="text-xs text-muted-foreground mt-1">Chỉ quản lý mới có thể thay đổi</p>
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Vai trò
                  </Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-foreground">{profile.role === "employee" ? "Nhân viên" : "Quản lý"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} disabled={updating}>
                    {updating ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" disabled={updating}>
                    Hủy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Tài khoản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Đăng xuất</h4>
                  <p className="text-sm text-muted-foreground">Đăng xuất khỏi tài khoản hiện tại</p>
                </div>
                <Button onClick={logout} variant="outline">
                  Đăng xuất
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </ProtectedPage>
  )
}
