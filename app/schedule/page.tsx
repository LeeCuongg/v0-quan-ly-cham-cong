"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProtectedPage } from "@/components/protected-page"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { CalendarDays, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, Plus, AlertCircle } from "lucide-react"

interface ScheduleEntry {
  date: string
  checkIn?: string
  checkOut?: string
  totalHours: number
  salary: number
  status: "present" | "absent" | "partial" | "future"
}

interface WeeklySchedule {
  weekStart: string
  weekEnd: string
  entries: ScheduleEntry[]
  totalHours: number
  totalSalary: number
  expectedHours: number
}

export default function SchedulePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchWeeklySchedule()
    }
  }, [user, currentWeek])

  const fetchWeeklySchedule = async () => {
    setLoading(true)
    try {
      const weekStart = getWeekStart(currentWeek)
      const weekEnd = getWeekEnd(currentWeek)

      console.log("[SCHEDULE] Fetching data for week:", weekStart.toISOString().split("T")[0], "to", weekEnd.toISOString().split("T")[0])

      const response = await fetch(
        `/api/my-timesheets?startDate=${weekStart.toISOString().split("T")[0]}&endDate=${weekEnd.toISOString().split("T")[0]}`,
      )

      if (response.ok) {
        const data = await response.json()
        console.log("[SCHEDULE] API Response:", data)
        
        const weeklySchedule = generateWeeklySchedule(weekStart, weekEnd, data.timesheets || [])
        console.log("[SCHEDULE] Generated schedule:", weeklySchedule)
        
        setSchedule(weeklySchedule)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("[SCHEDULE] Error fetching schedule:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải lịch làm việc",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getWeekStart = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    return start
  }

  const getWeekEnd = (date: Date) => {
    const end = getWeekStart(date)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return end
  }

  const generateWeeklySchedule = (weekStart: Date, weekEnd: Date, timesheets: any[]): WeeklySchedule => {
    const entries: ScheduleEntry[] = []
    const today = new Date()
    
    // Lấy ngày hiện tại theo timezone local, không dùng UTC
    const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0')

    console.log("[SCHEDULE] Today string:", todayStr)
    console.log("[SCHEDULE] Generating schedule with timesheets:", timesheets)

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart)
      currentDate.setDate(weekStart.getDate() + i)
      const dateStr = currentDate.toISOString().split("T")[0]

      // Tìm timesheet cho ngày này
      const timesheet = timesheets.find((ts) => ts.date === dateStr)
      console.log("[SCHEDULE] Processing date:", dateStr, "Today:", todayStr, "Timesheet:", timesheet)

      let status: ScheduleEntry["status"] = "future"
      let checkIn: string | undefined
      let checkOut: string | undefined
      let totalHours = 0
      let salary = 0

      // Kiểm tra xem ngày này có phải là tương lai không
      const isFuture = dateStr > todayStr
      console.log("[SCHEDULE] Date:", dateStr, "Is future:", isFuture)

      if (timesheet) {
        // Có timesheet - lấy dữ liệu từ timesheet
        checkIn = timesheet.check_in_time || (timesheet.check_in ? new Date(timesheet.check_in).toLocaleTimeString("vi-VN", { hour12: false }).slice(0, 5) : undefined)
        checkOut = timesheet.check_out_time || (timesheet.check_out ? new Date(timesheet.check_out).toLocaleTimeString("vi-VN", { hour12: false }).slice(0, 5) : undefined)
        totalHours = timesheet.total_hours || timesheet.hours_worked || 0
        salary = timesheet.salary || 0

        if (checkIn && checkOut) {
          status = "present" // Đã hoàn thành (có cả check-in và check-out)
        } else if (checkIn) {
          status = "partial" // Đang làm việc (chỉ có check-in)
        } else {
          status = "absent" // Bất thường: có timesheet nhưng không có check-in
        }

        console.log("[SCHEDULE] Timesheet found - CheckIn:", checkIn, "CheckOut:", checkOut, "Status:", status)
      } else {
        // Không có timesheet
        if (isFuture) {
          status = "future" // Ngày tương lai
        } else {
          status = "absent" // Ngày đã qua nhưng không có timesheet = vắng mặt
        }
        console.log("[SCHEDULE] No timesheet - Status:", status)
      }

      entries.push({
        date: dateStr,
        checkIn,
        checkOut,
        totalHours,
        salary,
        status,
      })
    }

    const totalHours = entries.reduce((sum, entry) => sum + entry.totalHours, 0)
    const totalSalary = entries.reduce((sum, entry) => sum + entry.salary, 0)
    const expectedHours = 40 // 8 hours * 5 working days

    return {
      weekStart: weekStart.toISOString().split("T")[0],
      weekEnd: weekEnd.toISOString().split("T")[0],
      entries,
      totalHours,
      totalSalary,
      expectedHours,
    }
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date())
  }

  const getStatusBadge = (status: ScheduleEntry["status"]) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Có mặt
          </Badge>
        )
      case "partial":
        return (
          <Badge className="bg-yellow-500">
            <AlertCircle className="w-3 h-3 mr-1" />
            Đang làm việc
          </Badge>
        )
      case "absent":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Vắng mặt
          </Badge>
        )
      case "future":
        return <Badge variant="outline">Chưa đến</Badge>
    }
  }

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00') // Thêm time để tránh timezone issues
    return date.toLocaleDateString("vi-VN", { weekday: "long" })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00') // Thêm time để tránh timezone issues
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  if (loading) {
    return (
      <ProtectedPage requiredRole="employee">
        <main className="p-4 lg:p-8">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-48 mb-2"></div>
              <div className="h-4 bg-muted rounded w-64"></div>
            </div>
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </main>
      </ProtectedPage>
    )
  }

  return (
    <ProtectedPage requiredRole="employee">
      <main className="p-4 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Lịch làm việc</h1>
              <p className="text-muted-foreground">Quản lý lịch trình làm việc của {user?.name}</p>
            </div>
          </div>

          {/* Week Navigation */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Tuần từ {schedule && formatDate(schedule.weekStart)} - {schedule && formatDate(schedule.weekEnd)}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                    Hôm nay
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Weekly Summary */}
          {schedule && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Tổng giờ tuần</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{schedule.totalHours.toFixed(1)}h</div>
                  <p className="text-xs text-muted-foreground">Mục tiêu: {schedule.expectedHours}h</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Tổng lương tuần</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(schedule.totalSalary)}</div>
                  <p className="text-xs text-muted-foreground">Lương theo giờ: {user?.hourlyRate.toLocaleString("vi-VN")}đ</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Tiến độ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((schedule.totalHours / schedule.expectedHours) * 100).toFixed(0)}%
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((schedule.totalHours / schedule.expectedHours) * 100, 100)}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ngày có mặt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {schedule.entries.filter((e) => e.status === "present" || e.status === "partial").length}/7
                  </div>
                  <p className="text-xs text-muted-foreground">Ngày trong tuần</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Daily Schedule */}
          {schedule && (
            <Card>
              <CardHeader>
                <CardTitle>Chi tiết từng ngày</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {schedule.entries.map((entry, index) => (
                    <div
                      key={entry.date}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[80px]">
                          <div className="font-medium">{getDayName(entry.date)}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(entry.date)}</div>
                        </div>

                        <div className="flex items-center gap-2">{getStatusBadge(entry.status)}</div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="text-muted-foreground">Check-in</div>
                          <div className="font-medium">{entry.checkIn || "-"}</div>
                        </div>

                        <div className="text-center">
                          <div className="text-muted-foreground">Check-out</div>
                          <div className="font-medium">{entry.checkOut || "-"}</div>
                        </div>

                        <div className="text-center">
                          <div className="text-muted-foreground">Tổng giờ</div>
                          <div className="font-medium flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {entry.totalHours.toFixed(1)}h
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-muted-foreground">Lương</div>
                          <div className="font-medium">
                            {entry.salary > 0 ? formatCurrency(entry.salary) : "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button className="h-16 flex flex-col gap-2" asChild>
                  <a href="/checkin">
                    <Plus className="w-5 h-5" />
                    <span>Chấm công ngay</span>
                  </a>
                </Button>

                <Button variant="outline" className="h-16 flex flex-col gap-2 bg-transparent" asChild>
                  <a href="/my-timesheets">
                    <CalendarDays className="w-5 h-5" />
                    <span>Xem lịch sử đầy đủ</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </ProtectedPage>
  )
}
