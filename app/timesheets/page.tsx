"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ProtectedPage } from "@/components/protected-page"
import { useAuth } from "@/components/auth-provider"
import { Calendar, Clock, DollarSign, Download, Filter, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Timesheet {
  id: string
  employee_id: string
  employee_name: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  check_in: string | null  // timestamp
  check_out: string | null // timestamp
  total_hours: number
  hours_worked: number
  salary: number
  created_at: string
  updated_at: string
}

interface Summary {
  totalHours: number
  totalSalary: number
  totalDays: number
  avgHoursPerDay: number
}

export default function MyTimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [summary, setSummary] = useState<Summary>({ 
    totalHours: 0, 
    totalSalary: 0, 
    totalDays: 0,
    avgHoursPerDay: 0
  })
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    // Đặt default dates - tháng hiện tại
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setStartDate(firstDay.toISOString().split("T")[0])
    setEndDate(lastDay.toISOString().split("T")[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate && user) {
      fetchTimesheets()
    }
  }, [startDate, endDate, user])

  const fetchTimesheets = async () => {
    if (!user) return

    console.log("[Frontend] Fetching timesheets with params:", { startDate, endDate })
    setLoading(true)
    
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      })

      const response = await fetch(`/api/my-timesheets?${params}`)
      console.log("[Frontend] Response status:", response.status)
      
      const data = await response.json()
      console.log("[Frontend] Response data:", data)

      if (response.ok) {
        setTimesheets(data.timesheets || [])
        setSummary(data.summary || { 
          totalHours: 0, 
          totalSalary: 0, 
          totalDays: 0,
          avgHoursPerDay: 0
        })
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Không thể tải dữ liệu",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Frontend] Error fetching timesheets:", error)
      toast({
        title: "Lỗi",
        description: "Lỗi kết nối server",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setStartDate(firstDay.toISOString().split("T")[0])
    setEndDate(lastDay.toISOString().split("T")[0])
  }

  const setQuickRange = (range: "week" | "month" | "last7days" | "last30days") => {
    const now = new Date()

    switch (range) {
      case "week":
        // Tuần này (Thứ 2 - Chủ nhật)
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Thứ 2
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6) // Chủ nhật
        setStartDate(startOfWeek.toISOString().split("T")[0])
        setEndDate(endOfWeek.toISOString().split("T")[0])
        break
      case "month":
        // Tháng này
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        setStartDate(firstDay.toISOString().split("T")[0])
        setEndDate(lastDay.toISOString().split("T")[0])
        break
      case "last7days":
        // 7 ngày qua
        const last7Days = new Date(now)
        last7Days.setDate(now.getDate() - 7)
        setStartDate(last7Days.toISOString().split("T")[0])
        setEndDate(now.toISOString().split("T")[0])
        break
      case "last30days":
        // 30 ngày qua
        const last30Days = new Date(now)
        last30Days.setDate(now.getDate() - 30)
        setStartDate(last30Days.toISOString().split("T")[0])
        setEndDate(now.toISOString().split("T")[0])
        break
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "-"
    
    // Nếu là timestamp full, extract time
    if (timeString.includes("T") || timeString.includes(" ")) {
      try {
        return new Date(timeString).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit"
        })
      } catch {
        return timeString
      }
    }
    
    // Nếu là time format (HH:MM:SS), chỉ lấy HH:MM
    if (timeString.includes(":")) {
      return timeString.substring(0, 5)
    }
    
    return timeString
  }

  const getStatusBadge = (timesheet: Timesheet) => {
    const hasCheckIn = !!(timesheet.check_in_time || timesheet.check_in)
    const hasCheckOut = !!(timesheet.check_out_time || timesheet.check_out)

    if (hasCheckIn && hasCheckOut) {
      return (
        <Badge variant="default" className="bg-green-500">
          Hoàn thành
        </Badge>
      )
    } else if (hasCheckIn && !hasCheckOut) {
      return (
        <Badge variant="secondary" className="bg-yellow-500 text-white">
          Chưa check-out
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive">
          Không hợp lệ
        </Badge>
      )
    }
  }

  const exportData = () => {
    // Tạo CSV data
    const headers = ["Ngày", "Check In", "Check Out", "Tổng giờ", "Lương (VNĐ)", "Trạng thái"]
    const csvData = [
      headers.join(","),
      ...timesheets.map(timesheet => [
        `"${formatDate(timesheet.date)}"`,
        `"${formatTime(timesheet.check_in_time || timesheet.check_in)}"`,
        `"${formatTime(timesheet.check_out_time || timesheet.check_out)}"`,
        timesheet.total_hours || timesheet.hours_worked || 0,
        timesheet.salary || 0,
        `"${timesheet.check_out_time || timesheet.check_out ? 'Hoàn thành' : 'Chưa check-out'}"`
      ].join(","))
    ].join("\n")

    // Download file
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `timesheet-${user?.name}-${startDate}-${endDate}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <ProtectedPage requiredRole="employee">
      <main className="p-4 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lịch sử chấm công</h1>
            <p className="text-muted-foreground">
              Xem lại thời gian làm việc của {user?.name}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng giờ làm</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalHours.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">
                  Trung bình: {summary.avgHoursPerDay.toFixed(1)}h/ngày
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng lương</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.totalSalary.toLocaleString("vi-VN")}đ
                </div>
                <p className="text-xs text-muted-foreground">
                  Lương/giờ: {user?.hourlyRate.toLocaleString("vi-VN")}đ
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Số ngày làm</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalDays}</div>
                <p className="text-xs text-muted-foreground">Ngày đã làm việc</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {timesheets.length > 0 ? 
                    ((timesheets.filter(ts => ts.check_out_time || ts.check_out).length / timesheets.length) * 100).toFixed(0)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Check-out đầy đủ</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Bộ lọc thời gian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuickRange("week")}>
                  Tuần này
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange("month")}>
                  Tháng này
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange("last7days")}>
                  7 ngày qua
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange("last30days")}>
                  30 ngày qua
                </Button>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Xóa bộ lọc
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="flex items-end">
                  <Button onClick={exportData} variant="outline" className="w-full bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Xuất Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timesheets Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Bảng chấm công ({timesheets.length} bản ghi)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    Đang tải...
                  </div>
                </div>
              ) : timesheets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">Không có dữ liệu chấm công</p>
                  <p className="text-sm">Trong khoảng thời gian {formatDate(startDate)} - {formatDate(endDate)}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Ngày</th>
                        <th className="text-left p-3 font-medium">Check In</th>
                        <th className="text-left p-3 font-medium">Check Out</th>
                        <th className="text-left p-3 font-medium">Tổng giờ</th>
                        <th className="text-left p-3 font-medium">Lương</th>
                        <th className="text-left p-3 font-medium">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timesheets.map((timesheet) => (
                        <tr key={timesheet.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div className="font-medium">
                              {formatDate(timesheet.date)}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-sm">
                            {formatTime(timesheet.check_in_time || timesheet.check_in)}
                          </td>
                          <td className="p-3 font-mono text-sm">
                            {formatTime(timesheet.check_out_time || timesheet.check_out)}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold">
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
        </div>
      </main>
    </ProtectedPage>
  )
}
