"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EmployeeFormProps {
  employee?: any
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function EmployeeForm({ employee, onSubmit, onCancel }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    name: employee?.name || "",
    email: employee?.email || "",
    hourly_rate: employee?.hourly_rate || 0,
    overtime_hourly_rate: employee?.overtime_hourly_rate || 30000,
    role: employee?.role || "employee",
    phone: employee?.phone || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {employee ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Họ tên</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Vai trò</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleChange("role", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Nhân viên</SelectItem>
                <SelectItem value="manager">Quản lý</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Lương/giờ (VNĐ)</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => handleChange("hourly_rate", parseFloat(e.target.value) || 0)}
                required
                placeholder="Ví dụ: 25000 hoặc 23.3333"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overtime_hourly_rate">Lương Overtime/giờ (VNĐ)</Label>
              <Input
                id="overtime_hourly_rate"
                type="number"
                step="0.01"
                value={formData.overtime_hourly_rate}
                onChange={(e) => handleChange("overtime_hourly_rate", parseFloat(e.target.value) || 30000)}
                required
                placeholder="Ví dụ: 30000 hoặc 35.5"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {employee ? "Cập nhật" : "Thêm mới"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Hủy
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
