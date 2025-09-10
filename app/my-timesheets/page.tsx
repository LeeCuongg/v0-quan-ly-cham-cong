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
    totalDays: 0,
    avgHoursPerDay: 0
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
        setSummary(data.summary || { totalHours: 0, totalSalary: 0, totalDays: 0, avgHoursPerDay: 0 })
        
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

  const setQuickRange = (range: "week" | "month") => {
    const now = new Date()

    if (range === "week") {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6))
      setStartDate(startOfWeek.toISOString().split("T")[0])
      setEndDate(endOfWeek.toISOString().split("T")[0])
    } else {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      setStartDate(firstDay.toISOString().split("T")[0])
      setEndDate(lastDay.toISOString().split("T")[0])
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

          {/* Debug Panel (Remove after testing) */}
          {debugData && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-sm">🐛 Debug Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs space-y-2">
                  <p><strong>API Response:</strong> {JSON.stringify(debugData, null, 2)}</p>
                  <p><strong>Timesheets Count:</strong> {timesheets.length}</p>
                  <p><strong>Loading:</strong> {loading.toString()}</p>
                  <p><strong>User:</strong> {user?.name} ({user?.email})</p>
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
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setQuickRange("week")}>
                  Tuần này
                </Button>
                <Button variant="outline" onClick={() => setQuickRange("month")}>
                  Tháng này
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
                            <div className="font-medium">
                              {formatDate(timesheet.date)}
                            </div>
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
        </div>
      </main>
    </ProtectedPage>
  )
}
