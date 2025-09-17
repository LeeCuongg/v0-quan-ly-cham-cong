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
  error?: string
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

  const handleExportCSV = () => {
    try {
      const headers = [
        "date","shift_number","total_shifts_in_day","check_in","check_out","shift_hours","daily_total_hours","daily_overtime_hours","regular_pay","overtime_pay","total_pay"
      ]

  const rows = timesheets.map((t: Timesheet) => {
        const checkIn = t.check_in_time || t.check_in || ""
        const checkOut = t.check_out_time || t.check_out || ""
        const shiftHours = t.total_hours ?? t.hours_worked ?? 0
        const regularPay = t.regular_pay ?? 0
        const overtimePay = t.overtime_pay ?? 0
        const totalPay = regularPay + overtimePay
        return [
          t.date,
          String(t.shift_number ?? 1),
          String(t.total_shifts_in_day ?? 1),
          typeof checkIn === "string" ? checkIn : String(checkIn),
          typeof checkOut === "string" ? checkOut : String(checkOut),
          String(shiftHours),
          String(t.daily_total_hours ?? 0),
          String(t.daily_overtime_hours ?? 0),
          String(regularPay),
          String(overtimePay),
          String(totalPay),
        ]
      })

      const csv = [
        headers.join(","),
        ...rows.map((r: string[]) => r.map((v: string) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
      ].join("\n")
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const fileName = `my-timesheets_${startDate}_to_${endDate}.csv`
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("Export CSV error", e)
      toast({ title: "Xuất CSV thất bại", description: "Đã có lỗi khi xuất dữ liệu.", variant: "destructive" })
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
          {/* Summary Cards (Desktop) */}
          <div className="hidden md:grid md:grid-cols-7 gap-4">
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

          {/* Summary (Mobile condensed) */}
          <div className="md:hidden -mx-4 px-4">
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1">
              <Card className="min-w-[58%] snap-start">
                <CardHeader className="py-3 pb-1">
                  <CardTitle className="text-xs font-medium flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Tổng giờ
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="text-xl font-bold">{formatHours(summary.totalHours)}</div>
                  <p className="text-[11px] text-muted-foreground">TB: {formatHours(summary.avgHoursPerDay)}/ngày</p>
                </CardContent>
              </Card>
              <Card className="min-w-[58%] snap-start">
                <CardHeader className="py-3 pb-1">
                  <CardTitle className="text-xs font-medium flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-primary" /> Tổng lương
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="text-xl font-bold text-primary">{(summary.totalSalary + summary.totalOvertimeSalary).toLocaleString("vi-VN")}đ</div>
                  <p className="text-[11px] text-muted-foreground">CB: {summary.totalSalary.toLocaleString("vi-VN")}đ • TC: {summary.totalOvertimeSalary.toLocaleString("vi-VN")}đ</p>
                </CardContent>
              </Card>
              <Card className="min-w-[58%] snap-start">
                <CardHeader className="py-3 pb-1">
                  <CardTitle className="text-xs font-medium flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Ngày / Ca
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="text-xl font-bold">{summary.totalDays} ngày</div>
                  <p className="text-[11px] text-muted-foreground">{timesheets.length} ca</p>
                </CardContent>
              </Card>
              <Card className="min-w-[58%] snap-start">
                <CardHeader className="py-3 pb-1">
                  <CardTitle className="text-xs font-medium flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-orange-500" /> Tăng ca
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="text-xl font-bold text-orange-600">{formatHours(summary.totalOvertimeHours)}</div>
                  <p className="text-[11px] text-muted-foreground">TC: {summary.totalOvertimeSalary.toLocaleString("vi-VN")}đ</p>
                </CardContent>
              </Card>
            </div>
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
              <div className="flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible">
                <Button size="sm" variant="outline" onClick={() => setQuickRange("week")} className="whitespace-nowrap">
                  Tuần này
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuickRange("prevWeek")} className="whitespace-nowrap">
                  Tuần trước
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuickRange("month")} className="whitespace-nowrap">
                  Tháng này
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuickRange("prevMonth")} className="whitespace-nowrap">
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
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Đến ngày</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9"
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
                <div className="flex items-center gap-2">
                  <Button onClick={fetchTimesheets} disabled={loading} variant="outline" size="icon" className="md:hidden" aria-label="Làm mới">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2 hidden md:inline-flex">
                    <Download className="h-4 w-4" />
                    Xuất CSV
                  </Button>
                  <Button onClick={handleExportCSV} variant="outline" size="icon" className="md:hidden" aria-label="Xuất CSV">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
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
                <>
                  {/* Desktop table */}
                  <div className="overflow-x-auto hidden md:block">
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
                            const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
                            if (dateCompare !== 0) return dateCompare
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
                                  CB: {(timesheet.regular_pay || 0).toLocaleString("vi-VN")}đ
                                  {(timesheet.overtime_pay || 0) > 0 && (
                                    <div>TC: {(timesheet.overtime_pay || 0).toLocaleString("vi-VN")}đ</div>
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

                  {/* Mobile list */}
                  <div className="md:hidden space-y-3">
                    {timesheets
                      .sort((a, b) => {
                        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
                        if (dateCompare !== 0) return dateCompare
                        const aCheckIn = a.check_in_time || a.check_in || ""
                        const bCheckIn = b.check_in_time || b.check_in || ""
                        return bCheckIn.localeCompare(aCheckIn)
                      })
                      .map((t, idx) => (
                        <div key={t.id || idx} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">{formatDate(t.date)}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                <span>Ca {t.shift_number || 1}</span>
                                {(t.total_shifts_in_day || 1) > 1 && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0">{t.total_shifts_in_day} ca</Badge>
                                )}
                              </div>
                            </div>
                            {getStatusBadge(t)}
                          </div>

                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div className="rounded-md bg-muted px-2 py-1.5">
                              <div className="text-[10px] text-muted-foreground">Check In</div>
                              <div className="font-mono text-sm">{formatTime(t.check_in_time || t.check_in)}</div>
                            </div>
                            <div className="rounded-md bg-muted px-2 py-1.5">
                              <div className="text-[10px] text-muted-foreground">Check Out</div>
                              <div className="font-mono text-sm">{formatTime(t.check_out_time || t.check_out)}</div>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-[11px]">Ca: {formatHours((t.total_hours || t.hours_worked || 0))}</Badge>
                            <Badge variant="secondary" className="text-[11px]">Ngày: {formatHours(t.daily_total_hours || 0)}</Badge>
                            <Badge variant="secondary" className="text-[11px]">TC: {formatHours(t.daily_overtime_hours || 0)}</Badge>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-[11px] text-muted-foreground">
                              CB: {(t.regular_pay || 0).toLocaleString("vi-VN")}đ{(t.overtime_pay || 0) > 0 ? ` • TC: ${(t.overtime_pay || 0).toLocaleString("vi-VN")}đ` : ""}
                            </div>
                            <div className="font-semibold text-green-600">{(((t.regular_pay || 0) + (t.overtime_pay || 0))).toLocaleString("vi-VN")}đ</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </ProtectedPage>
  )
}
