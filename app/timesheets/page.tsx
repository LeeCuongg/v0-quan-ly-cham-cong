"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ProtectedPage } from "@/components/protected-page"
import { useAuth } from "@/components/auth-provider"
import { Calendar, Clock, DollarSign, Download, Filter, X, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface Summary {
  totalHours: number
  totalSalary: number
  totalDays: number
  avgHoursPerDay: number
}

interface ApiResponse {
  timesheets: Timesheet[]
  summary: Summary
  meta: {
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
    totalDays: 0,
    avgHoursPerDay: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    // Set default dates - current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const startDateStr = firstDay.toISOString().split("T")[0]
    const endDateStr = lastDay.toISOString().split("T")[0]
    
    console.log("[Frontend] Setting default dates:", { startDateStr, endDateStr })
    setStartDate(startDateStr)
    setEndDate(endDateStr)
  }, [])

  useEffect(() => {
    console.log("[Frontend] Effect triggered:", { startDate, endDate, user: !!user })
    if (startDate && endDate && user) {
      fetchTimesheets()
    }
  }, [startDate, endDate, user])

  const fetchTimesheets = async () => {
    if (!user) {
      console.log("[Frontend] No user, skipping fetch")
      return
    }

    console.log("[Frontend] ===== FETCHING TIMESHEETS =====")
    console.log("[Frontend] User:", user.name, user.id)
    console.log("[Frontend] Date range:", startDate, "to", endDate)
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      })
      
      const url = `/api/my-timesheets?${params}`
      console.log("[Frontend] Fetching from URL:", url)

      const response = await fetch(url)
      console.log("[Frontend] Response status:", response.status)
      console.log("[Frontend] Response ok:", response.ok)
      console.log("[Frontend] Response headers:", Object.fromEntries(response.headers.entries()))
      
      const responseText = await response.text()
      console.log("[Frontend] Raw response text:", responseText)
      
      let data: ApiResponse
      try {
        data = JSON.parse(responseText)
        console.log("[Frontend] Parsed response data:", data)
      } catch (parseError) {
        console.error("[Frontend] JSON parse error:", parseError)
        throw new Error("Invalid JSON response: " + responseText)
      }

      if (response.ok) {
        console.log("[Frontend] ✅ Success! Processing data...")
        console.log("[Frontend] Timesheets array:", data.timesheets)
        console.log("[Frontend] Summary:", data.summary)
        
        setTimesheets(data.timesheets || [])
        setSummary(data.summary || { 
          totalHours: 0, 
          totalSalary: 0, 
          totalDays: 0,
          avgHoursPerDay: 0
        })
        
        // Set debug info
        setDebugInfo({
          rawData: data,
          timesheetsCount: (data.timesheets || []).length,
          firstTimesheet: data.timesheets?.[0] || null,
          apiUrl: url,
          timestamp: new Date().toISOString()
        })
        
        console.log("[Frontend] State updated successfully")
        
      } else {
        console.log("[Frontend] ❌ API Error:", data)
        const errorMsg = (data as any)?.error || `HTTP ${response.status}`
        setError(errorMsg)
        toast({
          title: "Lỗi API",
          description: errorMsg,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Frontend] ❌ Fetch error:", error)
      const errorMsg = error instanceof Error ? error.message : "Lỗi không xác định"
      setError(errorMsg)
      toast({
        title: "Lỗi kết nối",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      console.log("[Frontend] ===== FETCH COMPLETE =====")
    }
  }

  const setQuickRange = (range: "week" | "month" | "last7days" | "last30days") => {
    const now = new Date()

    switch (range) {
      case "week":
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay() + 1)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        setStartDate(startOfWeek.toISOString().split("T")[0])
        setEndDate(endOfWeek.toISOString().split("T")[0])
        break
      case "month":
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        setStartDate(firstDay.toISOString().split("T")[0])
        setEndDate(lastDay.toISOString().split("T")[0])
        break
      case "last7days":
        const last7Days = new Date(now)
        last7Days.setDate(now.getDate() - 7)
        setStartDate(last7Days.toISOString().split("T")[0])
        setEndDate(now.toISOString().split("T")[0])
        break
      case "last30days":
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
    if (!timeString) return "—"
    
    // If timestamp, extract time
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
    
    // If time format, show HH:MM
    if (timeString.includes(":")) {
      return timeString.substring(0, 5)
    }
    
    return timeString
  }

  const getStatusBadge = (timesheet: Timesheet) => {
    const hasCheckIn = !!(timesheet.check_in_time || timesheet.check_in)
    const hasCheckOut = !!(timesheet.check_out_time || timesheet.check_out)

    if (hasCheckIn && hasCheckOut) {
      return <Badge className="bg-green-500">✅ Hoàn thành</Badge>
    } else if (hasCheckIn && !hasCheckOut) {
      return <Badge className="bg-yellow-500 text-white">⏳ Chưa check-out</Badge>
    } else {
      return <Badge variant="destructive">❌ Không hợp lệ</Badge>
    }
  }

  // Debug component
  const DebugPanel = () => {
    if (process.env.NODE_ENV !== 'development') return null
    
    return (
      <Card className="border-blue-500 bg-blue-50 mb-4">
        <CardHeader>
          <CardTitle className="text-blue-800 text-sm">🐛 Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div><strong>Loading:</strong> {loading.toString()}</div>
          <div><strong>Error:</strong> {error || "none"}</div>
          <div><strong>Timesheets count:</strong> {timesheets.length}</div>
          <div><strong>Date range:</strong> {startDate} → {endDate}</div>
          <div><strong>User:</strong> {user?.name} ({user?.id})</div>
          {debugInfo && (
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Raw API Data</summary>
              <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    )
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

          {/* Debug Panel (only in development) */}
          <DebugPanel />

          {/* Error Display */}
          {error && (
            <Card className="border-red-500 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Lỗi: {error}</span>
                </div>
              </CardContent>
            </Card>
          )}

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
                  Lương/giờ: {user?.hourlyRate?.toLocaleString("vi-VN") || "N/A"}đ
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

          {/* Quick Filters */}
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
                <Button variant="outline" size="sm" onClick={fetchTimesheets}>
                  🔄 Làm mới
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
                  <Button onClick={fetchTimesheets} variant="outline" className="w-full">
                    🔍 Tìm kiếm
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timesheets Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                📋 Bảng chấm công ({timesheets.length} bản ghi)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    Đang tải dữ liệu...
                  </div>
                </div>
              ) : timesheets.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium mb-2">Không có dữ liệu chấm công</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Trong khoảng {formatDate(startDate)} - {formatDate(endDate)}
                  </p>
                  <Button onClick={fetchTimesheets} variant="outline">
                    🔄 Thử lại
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">📅 Ngày</th>
                        <th className="text-left p-3 font-medium">⏰ Check In</th>
                        <th className="text-left p-3 font-medium">🏃 Check Out</th>
                        <th className="text-left p-3 font-medium">⏱️ Tổng giờ</th>
                        <th className="text-left p-3 font-medium">💰 Lương</th>
                        <th className="text-left p-3 font-medium">📊 Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timesheets.map((timesheet, index) => (
                        <tr key={timesheet.id || index} className="border-b hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <div className="font-medium">
                              {formatDate(timesheet.date)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(timesheet.date).toLocaleDateString("vi-VN", { weekday: "long" })}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-sm font-medium">
                              {formatTime(timesheet.check_in_time || timesheet.check_in)}
                            </div>
                            {timesheet.check_in_time && timesheet.check_in && (
                              <div className="text-xs text-muted-foreground">
                                DB: {timesheet.check_in_time} | {formatTime(timesheet.check_in)}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-sm font-medium">
                              {formatTime(timesheet.check_out_time || timesheet.check_out)}
                            </div>
                            {timesheet.check_out_time && timesheet.check_out && (
                              <div className="text-xs text-muted-foreground">
                                DB: {timesheet.check_out_time} | {formatTime(timesheet.check_out)}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-blue-600">
                              {(timesheet.total_hours || timesheet.hours_worked || 0).toFixed(1)}h
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Total: {timesheet.total_hours} | Worked: {timesheet.hours_worked}
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
