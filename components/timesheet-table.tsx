"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Filter, Download } from "lucide-react"
import { type Timesheet, type Employee, formatCurrency } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

export function TimesheetTable() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchEmployees()
    fetchTimesheets()
  }, [])

  useEffect(() => {
    fetchTimesheets()
  }, [selectedEmployee, startDate, endDate])

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees")
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      console.error("Failed to fetch employees:", error)
    }
  }

  const fetchTimesheets = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedEmployee !== "all") {
        params.append("employeeId", selectedEmployee)
      }
      if (startDate) {
        params.append("startDate", startDate)
      }
      if (endDate) {
        params.append("endDate", endDate)
      }

      const response = await fetch(`/api/timesheets?${params.toString()}`)
      const data = await response.json()
      setTimesheets(data)
    } catch (error) {
      console.error("Failed to fetch timesheets:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu chấm công",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedEmployee("all")
    setStartDate("")
    setEndDate("")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "Chưa check-out"
    return timeString
  }

  const getStatusBadge = (checkOut: string | null) => {
    if (!checkOut) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
          Đang làm việc
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
        Hoàn thành
      </span>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quản lý Chấm công
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 bg-muted rounded w-16"></div>
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Quản lý Chấm công
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Bộ lọc</span>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="employee-select">Nhân viên</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee-select">
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhân viên</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">Từ ngày</Label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Đến ngày</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full bg-transparent">
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Hiển thị {timesheets.length} bản ghi chấm công</p>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Xuất Excel
          </Button>
        </div>

        {/* Timesheet Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Tổng giờ</TableHead>
                <TableHead>Lương</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Không có dữ liệu chấm công
                  </TableCell>
                </TableRow>
              ) : (
                timesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell className="font-medium">{timesheet.employeeName}</TableCell>
                    <TableCell>{formatDate(timesheet.date)}</TableCell>
                    <TableCell className="font-mono">{timesheet.checkIn}</TableCell>
                    <TableCell className="font-mono">{formatTime(timesheet.checkOut)}</TableCell>
                    <TableCell className="font-semibold">
                      {timesheet.totalHours > 0 ? `${timesheet.totalHours}h` : "-"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {timesheet.salary > 0 ? formatCurrency(timesheet.salary) : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(timesheet.checkOut)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Statistics */}
        {timesheets.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-card rounded-lg border">
              <div className="text-sm text-muted-foreground">Tổng giờ làm việc</div>
              <div className="text-2xl font-bold text-primary">
                {timesheets.reduce((sum, t) => sum + t.totalHours, 0).toFixed(1)}h
              </div>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <div className="text-sm text-muted-foreground">Tổng chi phí lương</div>
              <div className="text-2xl font-bold text-secondary">
                {formatCurrency(timesheets.reduce((sum, t) => sum + t.salary, 0))}
              </div>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <div className="text-sm text-muted-foreground">Số ca làm việc</div>
              <div className="text-2xl font-bold text-accent">
                {timesheets.filter((t) => t.checkOut !== null).length}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
