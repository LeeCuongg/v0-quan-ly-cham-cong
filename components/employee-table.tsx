"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Edit, Users, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Cập nhật interface để match với dữ liệu thực từ DB
interface Employee {
  id: string
  name: string
  email: string
  hourly_rate: number  // Đổi từ hourlyRate thành hourly_rate
  total_hours_this_month: number  // Đổi từ totalHoursThisMonth thành total_hours_this_month
  is_currently_working: boolean  // Đổi từ isCurrentlyWorking thành is_currently_working
  role: string
  is_active: boolean
  phone: string
  created_at: string
  updated_at: string
}

export function EmployeeTable() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [newHourlyRate, setNewHourlyRate] = useState("")
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      console.log("[DEBUG] Fetching employees...")
      const response = await fetch("/api/employees")
      console.log("[DEBUG] Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("[DEBUG] Employees data:", data)
        
        // Lọc chỉ lấy employees (loại bỏ manager/admin)
        const employeeOnly = data.filter((emp: Employee) => emp.role === 'employee')
        setEmployees(employeeOnly)
        
        toast({
          title: "Thành công",
          description: `Đã tải ${employeeOnly.length} nhân viên`,
        })
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("[ERROR] Failed to fetch employees:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách nhân viên",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (employee: Employee) => {
    setEditingEmployee(employee)
    setNewHourlyRate(employee.hourly_rate.toString())
  }

  const handleUpdateHourlyRate = async () => {
    if (!editingEmployee) return

    const hourlyRate = Number.parseFloat(newHourlyRate)
    if (isNaN(hourlyRate) || hourlyRate < 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mức lương hợp lệ",
        variant: "destructive",
      })
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hourlyRate }),
      })

      if (response.ok) {
        const updatedEmployee = await response.json()
        
        // Cập nhật state với dữ liệu mới
        setEmployees(employees.map((emp) => 
          emp.id === editingEmployee.id 
            ? { ...emp, hourly_rate: hourlyRate }
            : emp
        ))
        
        setEditingEmployee(null)
        setNewHourlyRate("")
        
        toast({
          title: "Thành công",
          description: `Đã cập nhật lương cho ${editingEmployee.name}`,
        })
      } else {
        throw new Error("Failed to update employee")
      }
    } catch (error) {
      console.error("Failed to update employee:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật mức lương",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const getStatusBadge = (isWorking: boolean) => {
    return isWorking ? (
      <Badge className="bg-green-500 text-white">
        Đang làm việc
      </Badge>
    ) : (
      <Badge variant="secondary">
        Nghỉ
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Quản lý Nhân viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Đang tải dữ liệu...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Quản lý Nhân viên
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchEmployees}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Không có nhân viên nào</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên nhân viên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Lương theo giờ</TableHead>
                    <TableHead>Tổng giờ tháng này</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                      <TableCell>{employee.phone || "Chưa cập nhật"}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(employee.hourly_rate)}
                      </TableCell>
                      <TableCell>{employee.total_hours_this_month}h</TableCell>
                      <TableCell>
                        {getStatusBadge(employee.is_currently_working)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(employee.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(employee)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Chỉnh sửa {employee.name}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary Cards */}
          {employees.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Tổng nhân viên</h3>
                <div className="text-2xl font-bold">{employees.length}</div>
              </div>
              
              <div className="rounded-lg border bg-card p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Đang làm việc</h3>
                <div className="text-2xl font-bold text-green-600">
                  {employees.filter(emp => emp.is_currently_working).length}
                </div>
              </div>
              
              <div className="rounded-lg border bg-card p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Lương trung bình</h3>
                <div className="text-2xl font-bold">
                  {employees.length > 0 ? 
                    formatCurrency(employees.reduce((sum, emp) => sum + emp.hourly_rate, 0) / employees.length)
                    : "0đ"
                  }
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Hourly Rate Modal */}
      <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa mức lương</DialogTitle>
            <DialogDescription>
              Cập nhật mức lương theo giờ cho {editingEmployee?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hourlyRate" className="text-right">
                Lương/giờ
              </Label>
              <Input
                id="hourlyRate"
                type="number"
                value={newHourlyRate}
                onChange={(e) => setNewHourlyRate(e.target.value)}
                className="col-span-3"
                placeholder="Nhập mức lương theo giờ"
                min="0"
                step="1000"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Mức lương hiện tại: {editingEmployee && formatCurrency(editingEmployee.hourly_rate)}
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setEditingEmployee(null)
                setNewHourlyRate("")
              }} 
              disabled={updating}
            >
              Hủy
            </Button>
            <Button 
              type="button" 
              onClick={handleUpdateHourlyRate} 
              disabled={updating}
            >
              {updating ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
