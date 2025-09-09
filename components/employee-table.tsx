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
import { Edit, Users } from "lucide-react"
import { type Employee, formatCurrency } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

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
    try {
      const response = await fetch("/api/employees")
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      console.error("Failed to fetch employees:", error)
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
    setNewHourlyRate(employee.hourlyRate.toString())
  }

  const handleUpdateHourlyRate = async () => {
    if (!editingEmployee) return

    const hourlyRate = Number.parseFloat(newHourlyRate)
    if (isNaN(hourlyRate) || hourlyRate <= 0) {
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
        setEmployees(employees.map((emp) => (emp.id === editingEmployee.id ? updatedEmployee : emp)))
        setEditingEmployee(null)
        toast({
          title: "Thành công",
          description: "Đã cập nhật mức lương thành công",
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
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-4 bg-muted rounded w-48"></div>
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Quản lý Nhân viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên nhân viên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Lương theo giờ</TableHead>
                  <TableHead>Tổng giờ tháng này</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(employee.hourlyRate)}</TableCell>
                    <TableCell>{employee.totalHoursThisMonth}h</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          employee.isCurrentlyWorking
                            ? "bg-secondary/10 text-secondary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {employee.isCurrentlyWorking ? "Đang làm việc" : "Nghỉ"}
                      </span>
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
        </CardContent>
      </Card>

      {/* Edit Hourly Rate Modal */}
      <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa mức lương</DialogTitle>
            <DialogDescription>Cập nhật mức lương theo giờ cho {editingEmployee?.name}</DialogDescription>
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
              Mức lương hiện tại: {editingEmployee && formatCurrency(editingEmployee.hourlyRate)}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingEmployee(null)} disabled={updating}>
              Hủy
            </Button>
            <Button type="button" onClick={handleUpdateHourlyRate} disabled={updating}>
              {updating ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
