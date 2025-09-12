"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Users, Edit, Trash2, Plus } from "lucide-react"
import { EmployeeForm } from "./employee-form"

interface Employee {
  id: string
  name: string
  email: string
  hourly_rate: number
  overtime_hourly_rate: number
  role: string
  phone?: string
  is_active: boolean
  total_hours_this_month: number
  is_currently_working: boolean
}

export function EmployeeTable() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: any) => {
    try {
      const url = editingEmployee 
        ? `/api/employees/${editingEmployee.id}`
        : '/api/employees'
      
      const method = editingEmployee ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchEmployees()
        setShowForm(false)
        setEditingEmployee(null)
      }
    } catch (error) {
      console.error('Error saving employee:', error)
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingEmployee(null)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingEmployee(null)
  }

  const getRoleBadge = (role: string) => {
    if (role === 'manager') {
      return <Badge variant="default">Quản lý</Badge>
    }
    return <Badge variant="secondary">Nhân viên</Badge>
  }

  const getStatusBadge = (isWorking: boolean) => {
    if (isWorking) {
      return <Badge variant="destructive">Đang làm</Badge>
    }
    return <Badge variant="outline">Nghỉ</Badge>
  }

  if (loading) {
    return <div>Đang tải dữ liệu...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Quản lý Nhân viên
          </CardTitle>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Thêm nhân viên
              </Button>
            </DialogTrigger>
            <DialogContent>
              <EmployeeForm
                employee={editingEmployee}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Lương/giờ</TableHead>
                <TableHead className="text-orange-600">Lương OT/giờ</TableHead>
                <TableHead>Giờ tháng này</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Không có nhân viên nào
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{getRoleBadge(employee.role)}</TableCell>
                    <TableCell>{employee.hourly_rate?.toLocaleString('vi-VN')}đ</TableCell>
                    <TableCell className="text-orange-600 font-medium">
                      {employee.overtime_hourly_rate?.toLocaleString('vi-VN')}đ
                    </TableCell>
                    <TableCell>{employee.total_hours_this_month}h</TableCell>
                    <TableCell>{getStatusBadge(employee.is_currently_working)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Statistics */}
        {employees.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-card rounded-lg border">
              <div className="text-sm text-muted-foreground">Tổng nhân viên</div>
              <div className="text-2xl font-bold text-primary">
                {employees.length}
              </div>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <div className="text-sm text-muted-foreground">Đang làm việc</div>
              <div className="text-2xl font-bold text-green-600">
                {employees.filter(e => e.is_currently_working).length}
              </div>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <div className="text-sm text-muted-foreground">Lương OT trung bình</div>
              <div className="text-2xl font-bold text-orange-600">
                {(employees.reduce((sum, e) => sum + e.overtime_hourly_rate, 0) / employees.length).toLocaleString('vi-VN')}đ
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
