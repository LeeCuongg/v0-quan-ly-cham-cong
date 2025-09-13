"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ProtectedPage } from "@/components/protected-page"
import { useAuth } from "@/components/auth-provider"
import { Calendar, Clock, DollarSign, Filter, Download, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Timesheet {
  id: string
  employee_id: string
  employee_name: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  check_in: string | null  // timestamp format
  check_out: string | null // timestamp format
  total_hours: number
  hours_worked: number
  overtime_hours: number
  regular_hours: number
  regular_pay: number
  overtime_pay: number
  salary: number
  overtime_salary: number
  // Thông tin về ngày
  daily_total_hours: number
  daily_regular_hours: number
  daily_overtime_hours: number
  shift_number: number
  total_shifts_in_day: number
  created_at: string
  updated_at: string
}

interface Summary {
  totalHours: number
  totalSalary: number
  totalOvertimeHours: number
  totalOvertimeSalary: number
  totalDays: number
  avgHoursPerDay: number
  totalShifts: number  // Thêm tổng số ca
}

interface ApiResponse {
  timesheets: Timesheet[]
  summary: Summary
  meta?: {
    total: number
    dateRange: {
      startDate: string
      endDate: string
    }
  }
}

export default function MyTimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [summary, setSummary] = useState<Summary>({ 
    totalHours: 0, 
    totalSalary: 0, 
    totalOvertimeHours: 0,
    totalOvertimeSalary: 0,
    totalDays: 0,
    avgHoursPerDay: 0,
    totalShifts: 0
  })
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [debugData, setDebugData] = useState<any>(null)

  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    // Set default dates - current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setStartDate(firstDay.toLocaleDateString('sv-SE'))
    setEndDate(lastDay.toLocaleDateString('sv-SE'))
  }, [])

  useEffect(() => {
    if (startDate && endDate && user) {
      fetchTimesheets()
    }
  }, [startDate, endDate, user])

  const fetchTimesheets = async () => {
    if (!user) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      })

      console.log("[MyTimesheets] Fetching with params:", { startDate, endDate })
      
      const response = await fetch(`/api/my-timesheets?${params}`)
      const data: ApiResponse = await response.json()

      console.log("[MyTimesheets] API Response:", data)
      setDebugData(data)

      if (response.ok) {
        setTimesheets(data.timesheets || [])
        setSummary(data.summary || { 
          totalHours: 0, 
          totalSalary: 0, 
          totalOvertimeHours: 0,
          totalOvertimeSalary: 0,
          totalDays: 0, 
          avgHoursPerDay: 0,
          totalShifts: 0
        })
        
        toast({
          title: "Tải dữ liệu thành công",
          description: `Tìm thấy ${data.timesheets?.length || 0} bản ghi`,
        })
      } else {
        throw new Error(data.error || "Lỗi tải dữ liệu")
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

  const setQuickRange = (range: "week" | "month" | "prevWeek" | "prevMonth") => {
    const now = new Date()

    if (range === "week") {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      setStartDate(startOfWeek.toLocaleDateString('sv-SE'))
      setEndDate(endOfWeek.toLocaleDateString('sv-SE'))
    } else if (range === "prevWeek") {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay() - 7)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      setStartDate(startOfWeek.toLocaleDateString('sv-SE'))
      setEndDate(endOfWeek.toLocaleDateString('sv-SE'))
    } else if (range === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      setStartDate(firstDay.toLocaleDateString('sv-SE'))
      setEndDate(lastDay.toLocaleDateString('sv-SE'))
    } else if (range === "prevMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
      setStartDate(firstDay.toLocaleDateString('sv-SE'))
      setEndDate(lastDay.toLocaleDateString('sv-SE'))
    }
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

  const formatHours = (hours: number) => {
    const totalMinutes = Math.round(hours * 60)
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    
    if (h === 0) return `${m} phút`
    if (m === 0) return `${h} giờ`
    return `${h} giờ ${m} phút`
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

  return (
    <ProtectedPage requiredRole="employee">
      <main className="p-4 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lịch sử chấm công</h1>
            <p className="text-muted-foreground">Xem lại thời gian làm việc của bạn</p>
          </div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng giờ làm</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatHours(summary.totalHours)}</div>
                <p className="text-xs text-muted-foreground">
                  Trung bình: {formatHours(summary.avgHoursPerDay)}/ngày
                </p>
              </CardContent>
            </Card>
                        <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng lương</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{(summary.totalSalary + summary.totalOvertimeSalary).toLocaleString("vi-VN")}đ</div>
                <p className="text-xs text-muted-foreground">
                  Cơ bản + Overtime
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Giờ tăng ca</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatHours(summary.totalOvertimeHours)}</div>
                <p className="text-xs text-muted-foreground">
                  Giờ làm thêm
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lương tăng ca</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{summary.totalOvertimeSalary.toLocaleString("vi-VN")}đ</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lương cơ bản</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalSalary.toLocaleString("vi-VN")}đ</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Số ngày làm</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalDays}</div>
                <p className="text-xs text-muted-foreground">
                  {timesheets.length} ca
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Thao tác</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Button onClick={fetchTimesheets} disabled={loading} className="w-full" size="sm">
                  {loading ? "Đang tải..." : "Làm mới"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Bộ lọc
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => setQuickRange("week")}>
                  Tuần này
                </Button>
                <Button variant="outline" onClick={() => setQuickRange("prevWeek")}>
                  Tuần trước
                </Button>
                <Button variant="outline" onClick={() => setQuickRange("month")}>
                  Tháng này
                </Button>
                <Button variant="outline" onClick={() => setQuickRange("prevMonth")}>
                  Tháng trước
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Từ ngày</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Đến ngày</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timesheets Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Bảng chấm công</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Xuất Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Đang tải...</p>
                </div>
              ) : timesheets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Không có dữ liệu chấm công trong khoảng thời gian này</p>
                  <p className="text-sm">Thử thay đổi khoảng thời gian hoặc kiểm tra kết nối</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Ngày / Ca</th>
                        <th className="text-left p-3 font-medium">Check In</th>
                        <th className="text-left p-3 font-medium">Check Out</th>
                        <th className="text-left p-3 font-medium">Giờ ca</th>
                        <th className="text-left p-3 font-medium">Tổng giờ/ngày</th>
                        <th className="text-left p-3 font-medium">TC/ngày</th>
                        <th className="text-left p-3 font-medium">Lương ca</th>
                        <th className="text-left p-3 font-medium">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timesheets
                        .sort((a, b) => {
                          // First sort by date (newest first)
                          const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
                          if (dateCompare !== 0) return dateCompare
                          
                          // Then sort by check-in time (latest first within same day)
                          const aCheckIn = a.check_in_time || a.check_in || ""
                          const bCheckIn = b.check_in_time || b.check_in || ""
                          return bCheckIn.localeCompare(aCheckIn)
                        })
                        .map((timesheet, index) => (
                        <tr key={timesheet.id || index} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-3">
                            <div className="font-medium">
                              {formatDate(timesheet.date)}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <span>Ca {timesheet.shift_number || 1}</span>
                              {(timesheet.total_shifts_in_day || 1) > 1 && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  {timesheet.total_shifts_in_day} ca
                                </Badge>
                              )}
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
                              {formatHours((timesheet.total_hours || timesheet.hours_worked || 0))}
                            </div>
                            <div className="text-xs text-muted-foreground">Ca này</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-purple-600">
                              {formatHours(timesheet.daily_total_hours || 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">Tổng ngày</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-orange-600">
                              {formatHours(timesheet.daily_overtime_hours || 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">TC ngày</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-green-600">
                              {((timesheet.regular_pay || 0) + (timesheet.overtime_pay || 0)).toLocaleString("vi-VN")}đ
                            </div>
                            <div className="text-xs text-muted-foreground">
                              CB: {(timesheet.regular_pay || timesheet.salary || 0).toLocaleString("vi-VN")}đ
                              {(timesheet.overtime_pay || timesheet.overtime_salary || 0) > 0 && (
                                <div>TC: {(timesheet.overtime_pay || timesheet.overtime_salary || 0).toLocaleString("vi-VN")}đ</div>
                              )}
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
        </div>
      </main>
    </ProtectedPage>
  )
}
