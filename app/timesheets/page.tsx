"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ProtectedPage } from "@/components/protected-page"
import { useAuth } from "@/components/auth-provider"
import { Clock, Filter, Download, RefreshCw, Users, Calendar, DollarSign, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Employee {
  id: string
  name: string
  email: string
  role: string
}

interface Timesheet {
  id: string
  employee_id: string
  employee_name: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  check_in: string | null
  check_out: string | null
  total_hours: number
  hours_worked: number
  salary: number
  created_at: string
  updated_at: string
}

interface TimesheetStats {
  totalHours: number
  totalSalary: number
  totalEntries: number
  activeEmployees: number
  completedShifts: number
}

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [stats, setStats] = useState<TimesheetStats>({
    totalHours: 0,
    totalSalary: 0,
    totalEntries: 0,
    activeEmployees: 0,
    completedShifts: 0
  })
  
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [debugData, setDebugData] = useState<any>(null)

  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
  // Set default dates - từ ngày 1 đầu tháng đến ngày hiện tại
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const today = new Date() // Ngày hiện tại thay vì cuối tháng

  setStartDate(firstDay.toISOString().split("T")[0])
  setEndDate(today.toISOString().split("T")[0]) // Thay đổi từ lastDay thành today

  // Fetch initial data
  fetchEmployees()
}, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchTimesheets()
    }
  }, [selectedEmployee, startDate, endDate])

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees")
      const data = await response.json()
      
      if (response.ok) {
        setEmployees(data)
        console.log("[Timesheets] Employees loaded:", data.length)
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
    }
  }

  const fetchTimesheets = async () => {
    setLoading(true)
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

      console.log("[Timesheets] Fetching with params:", { selectedEmployee, startDate, endDate })

      const response = await fetch(`/api/timesheets?${params.toString()}`)
      const data = await response.json()

      console.log("[Timesheets] API Response:", data)
      setDebugData(data)

      if (response.ok) {
        setTimesheets(data)
        calculateStats(data)
        
        toast({
          title: "Tải dữ liệu thành công",
          description: `Tìm thấy ${data.length} bản ghi chấm công`,
        })
      } else {
        throw new Error("Failed to fetch timesheets")
      }
    } catch (error) {
      console.error("Error fetching timesheets:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu chấm công",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (timesheetData: Timesheet[]) => {
    const totalHours = timesheetData.reduce((sum, ts) => sum + (ts.total_hours || ts.hours_worked || 0), 0)
    const totalSalary = timesheetData.reduce((sum, ts) => sum + (ts.salary || 0), 0)
    const completedShifts = timesheetData.filter(ts => ts.check_out_time || ts.check_out).length
    const uniqueEmployees = new Set(timesheetData.map(ts => ts.employee_id)).size

    setStats({
      totalHours: Math.round(totalHours * 100) / 100,
      totalSalary: Math.round(totalSalary),
      totalEntries: timesheetData.length,
      activeEmployees: uniqueEmployees,
      completedShifts
    })
  }

  const clearFilters = () => {
  setSelectedEmployee("all")
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const today = new Date() // Ngày hiện tại
  setStartDate(firstDay.toISOString().split("T")[0])
  setEndDate(today.toISOString().split("T")[0]) // Thay đổi từ lastDay thành today
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
    
    // If it's a timestamp (contains 'T' or timezone info)
    if (timeString.includes('T') || timeString.includes('+')) {
      return new Date(timeString).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    }
    
    // If it's just time format (HH:mm:ss)
    return timeString.slice(0, 5) // Get HH:mm only
  }

  const getStatusBadge = (timesheet: Timesheet) => {
    const hasCheckOut = timesheet.check_out_time || timesheet.check_out
    
    if (!hasCheckOut) {
      return (
        <Badge className="bg-blue-500">
          <Clock className="w-3 h-3 mr-1" />
          Đang làm việc
        </Badge>
      )
    }
    return (
      <Badge className="bg-green-500">
        <Calendar className="w-3 h-3 mr-1" />
        Hoàn thành
      </Badge>
    )
  }

  const exportToExcel = () => {
    // TODO: Implement Excel export
    toast({
      title: "Tính năng đang phát triển",
      description: "Xuất Excel sẽ được triển khai sớm",
    })
  }

  return (
    <ProtectedPage requiredRole="manager">
      {/* Remove the duplicate div and Sidebar - ProtectedPage already handles this */}
      <main className="p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý Chấm công</h1>
          <p className="text-muted-foreground">Theo dõi và quản lý thời gian làm việc của tất cả nhân viên</p>
        </div>
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng bản ghi</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEntries}</div>
              <p className="text-xs text-muted-foreground">Lần chấm công</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nhân viên</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeEmployees}</div>
              <p className="text-xs text-muted-foreground">Có hoạt động</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng giờ</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHours}h</div>
              <p className="text-xs text-muted-foreground">Thời gian làm việc</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng lương</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSalary.toLocaleString("vi-VN")}đ</div>
              <p className="text-xs text-muted-foreground">Chi phí nhân công</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedShifts}</div>
              <p className="text-xs text-muted-foreground">Ca làm việc</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
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
                <Input 
                  id="start-date" 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date">Đến ngày</Label>
                <Input 
                  id="end-date" 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Xóa bộ lọc
                </Button>
              </div>

              <div className="flex items-end">
                <Button onClick={fetchTimesheets} disabled={loading} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {loading ? "Đang tải..." : "Làm mới"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timesheets Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Bảng chấm công tổng hợp</CardTitle>
              <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2">
                <Download className="h-4 w-4" />
                Xuất Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Đang tải dữ liệu...</p>
              </div>
            ) : timesheets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Không có dữ liệu chấm công</p>
                <p className="text-sm">Thử thay đổi bộ lọc hoặc khoảng thời gian</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Nhân viên</th>
                      <th className="text-left p-3 font-medium">Ngày</th>
                      <th className="text-left p-3 font-medium">Check In</th>
                      <th className="text-left p-3 font-medium">Check Out</th>
                      <th className="text-left p-3 font-medium">Tổng giờ</th>
                      <th className="text-left p-3 font-medium">Lương</th>
                      <th className="text-left p-3 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timesheets.map((timesheet, index) => (
                      <tr key={timesheet.id || index} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3">
                          <div className="font-medium">{timesheet.employee_name}</div>
                          <div className="text-xs text-muted-foreground">ID: {timesheet.employee_id}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{formatDate(timesheet.date)}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(timesheet.date).toLocaleDateString("vi-VN", { weekday: "long" })}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-sm">
                            {formatTime(timesheet.check_in_time || timesheet.check_in)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-sm">
                            {formatTime(timesheet.check_out_time || timesheet.check_out)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-blue-600">
                            {(timesheet.total_hours || timesheet.hours_worked || 0).toFixed(1)}h
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-green-600">
                            {(timesheet.salary || 0).toLocaleString("vi-VN")}đ
                          </div>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(timesheet)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Stats */}
        {timesheets.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Thống kê chi tiết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Tổng ca làm việc:</span>
                  <span className="font-bold">{stats.totalEntries}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Ca đã hoàn thành:</span>
                  <span className="font-bold text-green-600">{stats.completedShifts}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Ca đang làm:</span>
                  <span className="font-bold text-blue-600">{stats.totalEntries - stats.completedShifts}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Tỷ lệ hoàn thành:</span>
                  <span className="font-bold text-primary">
                    {stats.totalEntries > 0 ? Math.round((stats.completedShifts / stats.totalEntries) * 100) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tóm tắt tài chính</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Tổng chi phí:</span>
                  <span className="font-bold text-green-600">{stats.totalSalary.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Chi phí/giờ trung bình:</span>
                  <span className="font-bold">
                    {stats.totalHours > 0 ? Math.round(stats.totalSalary / stats.totalHours).toLocaleString("vi-VN") : 0}đ
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Chi phí/nhân viên:</span>
                  <span className="font-bold">
                    {stats.activeEmployees > 0 ? Math.round(stats.totalSalary / stats.activeEmployees).toLocaleString("vi-VN") : 0}đ
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Giờ/ca trung bình:</span>
                  <span className="font-bold text-blue-600">
                    {stats.totalEntries > 0 ? (stats.totalHours / stats.totalEntries).toFixed(1) : 0}h
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </ProtectedPage>
  )
}
